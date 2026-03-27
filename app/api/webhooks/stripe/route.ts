import { ghlInboundWebhookBodyFailed } from "@/lib/ghl-inbound-webhook-response";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

/** GoHighLevel workflow inbound webhook (Stripe purchase → contact/tags in GHL). */
const GHL_PURCHASE_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/lL1nFSI2SuZyY9yXEnPv/webhook-trigger/d9557c22-9110-4f3c-9e1d-6bc4cc6ac7c6";

function splitName(name: string | null | undefined): {
  firstName?: string;
  lastName?: string;
} {
  if (!name?.trim()) return {};
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function notifyPurchaseWebhook(payload: {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  /** From checkout session metadata (e.g. boat-and-hotel | hotel-only). */
  product?: string;
  stripeSessionId: string;
  stripeCustomerId?: string;
  amountTotal: number | null;
  currency: string | null;
}): Promise<void> {
  const body = JSON.stringify(payload);
  const res = await fetch(GHL_PURCHASE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const text = await res.text();
  const ghlErr = ghlInboundWebhookBodyFailed(text);
  if (!res.ok || ghlErr) {
    const detail = ghlErr ?? text.slice(0, 500);
    console.error("[stripe webhook] GHL inbound webhook response:", {
      status: res.status,
      body: text.slice(0, 800),
    });
    throw new Error(
      `Purchase webhook failed (${res.status}): ${detail}`,
    );
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !whSecret) {
    console.error("[stripe webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email =
      session.customer_details?.email?.trim() ??
      session.customer_email?.trim();
    if (!email) {
      console.warn("[stripe webhook] checkout.session.completed without email");
      return NextResponse.json({ received: true });
    }

    const { firstName, lastName } = splitName(session.customer_details?.name);
    const phone = session.customer_details?.phone?.trim();
    const fullName = session.customer_details?.name?.trim();
    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : undefined;
    const product =
      typeof session.metadata?.product === "string"
        ? session.metadata.product
        : undefined;

    try {
      await notifyPurchaseWebhook({
        email,
        firstName,
        lastName,
        fullName,
        phone,
        product,
        stripeSessionId: session.id,
        stripeCustomerId,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
    } catch (e) {
      console.error(
        "[stripe webhook] Purchase webhook failed:",
        { sessionId: session.id },
        e,
      );
      return NextResponse.json(
        { error: "Purchase webhook failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
