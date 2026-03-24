const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

export const SUBSCRIBE_TAG = "from website";
export const SUBSCRIBE_SOURCE = "htns-website";

export const PURCHASE_TAGS = [
  "htns-book-party-2026",
  "htns-book-party-purchased",
] as const;
export const PURCHASE_SOURCE = "htns-book-party-stripe";

export function getGhlHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_API_VERSION,
  };
}

export async function findDuplicateContact(
  apiKey: string,
  locationId: string,
  email: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    email,
    locationId,
  });
  const res = await fetch(
    `${GHL_API_BASE}/contacts/search/duplicate?${params}`,
    {
      method: "GET",
      headers: getGhlHeaders(apiKey),
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { contact?: { id?: string }; id?: string };
  return data?.contact?.id ?? data?.id ?? null;
}

async function removeTag(
  apiKey: string,
  contactId: string,
  tag: string,
): Promise<boolean> {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method: "DELETE",
    headers: getGhlHeaders(apiKey),
    body: JSON.stringify({ tags: [tag] }),
  });
  return res.ok;
}

export async function addTag(
  apiKey: string,
  contactId: string,
  tag: string,
): Promise<boolean> {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method: "POST",
    headers: getGhlHeaders(apiKey),
    body: JSON.stringify({ tags: [tag] }),
  });
  return res.ok;
}

async function updateExistingSubscribeContact(
  apiKey: string,
  locationId: string,
  email: string,
): Promise<void> {
  const contactId = await findDuplicateContact(apiKey, locationId, email);
  if (!contactId) {
    throw new Error("Could not find existing contact to update");
  }
  await removeTag(apiKey, contactId, SUBSCRIBE_TAG);
  const added = await addTag(apiKey, contactId, SUBSCRIBE_TAG);
  if (!added) {
    throw new Error("Could not add tag to existing contact");
  }
}

export async function createOrUpdateGhlContact(email: string): Promise<void> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    throw new Error("GHL_API_KEY and GHL_LOCATION_ID must be set");
  }

  const res = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: "POST",
    headers: getGhlHeaders(apiKey),
    body: JSON.stringify({
      email,
      locationId,
      tags: [SUBSCRIBE_TAG],
      source: SUBSCRIBE_SOURCE,
    }),
  });

  if (res.ok) {
    return;
  }

  const err = (await res.json().catch(() => ({}))) as { message?: string };
  const message = err.message ?? res.statusText;
  const isDuplicate =
    res.status === 400 &&
    (message.toLowerCase().includes("duplicate") ||
      message.toLowerCase().includes("does not allow duplicated"));

  if (isDuplicate) {
    await updateExistingSubscribeContact(apiKey, locationId, email);
    return;
  }

  throw new Error(`GHL API error (${res.status}): ${message}`);
}

type GhlContactRow = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
};

async function fetchContactById(
  apiKey: string,
  contactId: string,
): Promise<GhlContactRow | null> {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: "GET",
    headers: getGhlHeaders(apiKey),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { contact?: GhlContactRow };
  return data.contact ?? null;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object" && "name" in t) {
        return String((t as { name?: string }).name ?? "");
      }
      return "";
    })
    .filter(Boolean);
}

function pickMergedField(
  existing: string | undefined,
  incoming: string | undefined,
): string | undefined {
  const ex = existing?.trim();
  if (ex) return ex;
  const inc = incoming?.trim();
  return inc || undefined;
}

export type PurchaseContactInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export async function upsertGhlContactFromPurchase(
  input: PurchaseContactInput,
): Promise<void> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    throw new Error("GHL_API_KEY and GHL_LOCATION_ID must be set");
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Email is required for GHL upsert");
  }

  const contactId = await findDuplicateContact(apiKey, locationId, email);

  if (!contactId) {
    const res = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: "POST",
      headers: getGhlHeaders(apiKey),
      body: JSON.stringify({
        email,
        locationId,
        firstName: input.firstName?.trim() || undefined,
        lastName: input.lastName?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        tags: [...PURCHASE_TAGS],
        source: PURCHASE_SOURCE,
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(
        `GHL create contact failed (${res.status}): ${err.message ?? res.statusText}`,
      );
    }
    return;
  }

  const existing = await fetchContactById(apiKey, contactId);
  const existingTags = normalizeTags(existing?.tags);

  const firstName = pickMergedField(existing?.firstName, input.firstName);
  const lastName = pickMergedField(existing?.lastName, input.lastName);
  const phone = pickMergedField(existing?.phone, input.phone);

  const putBody: Record<string, string> = {
    email,
    locationId,
  };
  if (firstName?.trim()) putBody.firstName = firstName.trim();
  if (lastName?.trim()) putBody.lastName = lastName.trim();
  if (phone?.trim()) putBody.phone = phone.trim();

  const putRes = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: "PUT",
    headers: getGhlHeaders(apiKey),
    body: JSON.stringify(putBody),
  });

  if (!putRes.ok) {
    const err = (await putRes.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(
      `GHL update contact failed (${putRes.status}): ${err.message ?? putRes.statusText}`,
    );
  }

  for (const tag of PURCHASE_TAGS) {
    if (existingTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      continue;
    }
    await addTag(apiKey, contactId, tag);
  }
}
