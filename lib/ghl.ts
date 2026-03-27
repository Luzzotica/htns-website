const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

export function getGhlHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_API_VERSION,
  };
}

/** GHL may return `message` as a string, string[], or nested structure. */
function ghlApiMessageToString(raw: unknown, fallback: string): string {
  if (raw == null) return fallback;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  if (Array.isArray(raw)) {
    const parts = raw
      .map((x) => ghlApiMessageToString(x, ""))
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join("; ") : fallback;
  }
  if (typeof raw === "object" && raw !== null && "message" in raw) {
    return ghlApiMessageToString(
      (raw as { message?: unknown }).message,
      fallback,
    );
  }
  try {
    return JSON.stringify(raw);
  } catch {
    return fallback;
  }
}

// ── GHL Custom Values (boat seat tracking) ──────────────────────────

function getGhlSeatsConfig() {
  const apiKey = process.env.GHL_API_KEY?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();
  const customValueId = process.env.GHL_CUSTOM_VALUE_BOAT_SEATS_ID?.trim();
  if (!apiKey || !locationId || !customValueId) {
    throw new Error(
      "GHL_API_KEY, GHL_LOCATION_ID, and GHL_CUSTOM_VALUE_BOAT_SEATS_ID must be set",
    );
  }
  return { apiKey, locationId, customValueId };
}

export async function getBoatSeatsRemaining(): Promise<number> {
  const { apiKey, locationId, customValueId } = getGhlSeatsConfig();
  const res = await fetch(
    `${GHL_API_BASE}/locations/${locationId}/customValues/${customValueId}`,
    { method: "GET", headers: getGhlHeaders(apiKey) },
  );
  if (!res.ok) {
    throw new Error(`GHL get custom value failed (${res.status})`);
  }
  const data = (await res.json()) as {
    customValue?: { value?: string };
  };
  const raw = data.customValue?.value?.trim();
  const seats = raw ? parseInt(raw, 10) : NaN;
  if (Number.isNaN(seats)) {
    throw new Error("GHL boat seats custom value is not a valid number");
  }
  return seats;
}

export async function decrementBoatSeats(): Promise<number> {
  const { apiKey, locationId, customValueId } = getGhlSeatsConfig();
  const current = await getBoatSeatsRemaining();
  const next = Math.max(0, current - 1);

  const res = await fetch(
    `${GHL_API_BASE}/locations/${locationId}/customValues/${customValueId}`,
    {
      method: "PUT",
      headers: getGhlHeaders(apiKey),
      body: JSON.stringify({ value: String(next) }),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: unknown };
    throw new Error(
      `GHL update custom value failed (${res.status}): ${ghlApiMessageToString(err.message, res.statusText)}`,
    );
  }
  return next;
}
