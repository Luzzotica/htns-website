import {
  resolveProductFromPriceId,
  type BookPartyProduct,
} from "@/lib/book-party-pricing";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "session_id required" },
      { status: 400 },
    );
  }

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });
    const paid = session.payment_status === "paid";

    const lineItem = session.line_items?.data?.[0];
    const priceId =
      typeof lineItem?.price === "object" && lineItem.price
        ? lineItem.price.id
        : undefined;

    const product: BookPartyProduct | null = paid
      ? (session.metadata?.product as BookPartyProduct | undefined) ??
        resolveProductFromPriceId(priceId)
      : null;

    const funnel =
      typeof session.metadata?.funnel === "string"
        ? session.metadata.funnel
        : null;

    return NextResponse.json({
      ok: paid,
      payment_status: session.payment_status,
      product,
      funnel,
      amount_total: paid ? session.amount_total : null,
      currency: paid ? session.currency : null,
    });
  } catch (err) {
    console.error("[book-party] session retrieve:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid session" },
      { status: 400 },
    );
  }
}
