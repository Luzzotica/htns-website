/** GHL inbound webhooks often return HTTP 200 with `{"status":"Error: ..."}` in the body. */
export function ghlInboundWebhookBodyFailed(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "empty response body";
  try {
    const data = JSON.parse(trimmed) as { status?: unknown };
    if (typeof data.status !== "string") return null;
    const s = data.status.trim();
    if (/^error\s*:/i.test(s)) return s;
    return null;
  } catch {
    return null;
  }
}
