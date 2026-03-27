import { ghlInboundWebhookBodyFailed } from "@/lib/ghl-inbound-webhook-response";
import { NextResponse } from "next/server";
import { emailSchema } from "@/lib/validations";

const DEFAULT_SUBSCRIBE_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/lL1nFSI2SuZyY9yXEnPv/webhook-trigger/e9b34572-f3b0-40df-84f2-0967a502dc76";

async function sendSubscribeWebhook(email: string): Promise<void> {
  const url =
    process.env.SUBSCRIBE_WEBHOOK_URL ?? DEFAULT_SUBSCRIBE_WEBHOOK_URL;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const text = await res.text();
  const ghlErr = ghlInboundWebhookBodyFailed(text);
  if (!res.ok || ghlErr) {
    const detail = ghlErr ?? text.slice(0, 500) ?? res.statusText;
    throw new Error(`Webhook error (${res.status}): ${detail}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email",
        },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    await sendSubscribeWebhook(email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Subscribe] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
