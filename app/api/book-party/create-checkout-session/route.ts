import { getStripePriceIdForBookParty } from "@/lib/book-party-pricing";
import { isValidBookPartyReturnPath } from "@/lib/book-party-return-path";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

const bodySchema = z.object({
  returnPath: z.string().min(1),
  /** Matches `globals.css` dark `--background` so embedded Checkout blends with the page. */
  colorScheme: z.enum(["light", "dark"]).optional(),
});

function getRequestOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    throw new Error("Missing Host header");
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body: returnPath required" },
      { status: 400 },
    );
  }

  const { returnPath, colorScheme = "light" } = parsed.data;
  if (!isValidBookPartyReturnPath(returnPath)) {
    return NextResponse.json({ error: "Invalid returnPath" }, { status: 400 });
  }

  let priceId: string;
  try {
    priceId = getStripePriceIdForBookParty();
  } catch (e) {
    console.error("[book-party] price config:", e);
    return NextResponse.json(
      { error: "Ticket pricing is not configured" },
      { status: 503 },
    );
  }

  let origin: string;
  try {
    origin = getRequestOrigin(request);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${origin}${returnPath}?session_id={CHECKOUT_SESSION_ID}`,
      customer_creation: "always",
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      ...(colorScheme === "dark"
        ? {
            branding_settings: {
              background_color: "#0a0a0a",
            },
          }
        : {}),
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Checkout session missing client secret" },
        { status: 500 },
      );
    }

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error("[book-party] Stripe session error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Try again later." },
      { status: 500 },
    );
  }
}
