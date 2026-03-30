import { ghlInboundWebhookBodyFailed } from "@/lib/ghl-inbound-webhook-response";
import { authorRequestSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

const AUTHOR_REQUEST_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/1xL67wbkdWfGcuZvxmTX/webhook-trigger/4ad47145-e7de-466f-a5c1-22fe82fc733c";

async function sendAuthorRequestWebhook(
  data: Record<string, string>,
): Promise<void> {
  const res = await fetch(AUTHOR_REQUEST_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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
    const parsed = authorRequestSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors).flat().find(Boolean) ?? "Invalid request";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    await sendAuthorRequestWebhook({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      bookTopic: parsed.data.bookTopic,
      targetAudience: parsed.data.targetAudience,
      qualifications: parsed.data.qualifications,
      previouslyPublished: parsed.data.previouslyPublished,
      additionalInfo: parsed.data.additionalInfo ?? "",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[become-an-author] Error:", err);
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
