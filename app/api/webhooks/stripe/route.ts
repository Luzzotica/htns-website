import { upsertGhlContactFromPurchase } from "@/lib/ghl";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

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

    try {
      await upsertGhlContactFromPurchase({
        email,
        firstName,
        lastName,
        phone,
      });
    } catch (e) {
      console.error(
        "[stripe webhook] GHL upsert failed:",
        { sessionId: session.id },
        e,
      );
      return NextResponse.json({ error: "GHL upsert failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
