import { ghlInboundWebhookBodyFailed } from "@/lib/ghl-inbound-webhook-response";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  firstName: z.string().min(1, "First name is required").max(120),
  lastName: z.string().min(1, "Last name is required").max(120),
  email: z.string().email("Please enter a valid email address"),
});

async function notifyFreeRegistrationWebhook(payload: {
  firstName: string;
  lastName: string;
  email: string;
  source: string;
}): Promise<void> {
  const url = process.env.GHL_BOOK_PARTY_FREE_REGISTRATION_WEBHOOK_URL?.trim();
  if (!url) {
    throw new Error("GHL_BOOK_PARTY_FREE_REGISTRATION_WEBHOOK_URL is not set");
  }

  const body = JSON.stringify(payload);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const text = await res.text();
  const ghlErr = ghlInboundWebhookBodyFailed(text);
  if (!res.ok || ghlErr) {
    const detail = ghlErr ?? text.slice(0, 500);
    console.error("[book-party register] GHL inbound webhook response:", {
      status: res.status,
      body: text.slice(0, 800),
    });
    throw new Error(`Registration webhook failed (${res.status}): ${detail}`);
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.firstName?.[0] ??
      first.lastName?.[0] ??
      first.email?.[0] ??
      "Invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { firstName, lastName, email } = parsed.data;

  try {
    await notifyFreeRegistrationWebhook({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      source: "htns_book_party_register",
    });
  } catch (e) {
    console.error("[book-party register]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message.includes("GHL_BOOK_PARTY")
            ? "Registration is not configured"
            : "Could not complete registration. Try again later.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
