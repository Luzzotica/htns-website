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

export function normalizeEmailForGhl(email: string): string {
  return email.trim().toLowerCase();
}

/** Trim and strip internal whitespace; Stripe checkout usually sends E.164. */
export function normalizePhoneForGhl(phone: string | undefined): string | null {
  if (!phone?.trim()) return null;
  const p = phone.trim().replace(/\s+/g, "");
  return p || null;
}

/** GHL duplicate search is picky about format; try several representations. */
function phoneVariantsForDuplicateSearch(phone: string): string[] {
  const raw = phone.trim().replace(/\s+/g, "");
  if (!raw) return [];
  const digits = raw.replace(/\D/g, "");
  const out = new Set<string>();
  out.add(raw);
  if (digits) out.add(digits);
  if (digits.length === 10) {
    out.add(`+1${digits}`);
    out.add(`1${digits}`);
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    out.add(`+${digits}`);
    const rest = digits.slice(1);
    if (rest.length === 10) out.add(rest);
  }
  return [...out];
}

async function findDuplicateContactIdByPhoneVariants(
  apiKey: string,
  locationId: string,
  phone: string,
): Promise<string | null> {
  for (const variant of phoneVariantsForDuplicateSearch(phone)) {
    const params = new URLSearchParams({ locationId, phone: variant });
    const id = await requestDuplicateContactId(apiKey, params);
    if (id) return id;
  }
  return null;
}

async function findDuplicateContactIdByEmailAndPhoneVariants(
  apiKey: string,
  locationId: string,
  email: string,
  phone: string,
): Promise<string | null> {
  const normalizedEmail = normalizeEmailForGhl(email);
  if (!normalizedEmail) return null;
  for (const variant of phoneVariantsForDuplicateSearch(phone)) {
    const params = new URLSearchParams({
      locationId,
      email: normalizedEmail,
      phone: variant,
    });
    const id = await requestDuplicateContactId(apiKey, params);
    if (id) return id;
  }
  return null;
}

async function requestDuplicateContactId(
  apiKey: string,
  searchParams: URLSearchParams,
): Promise<string | null> {
  const res = await fetch(
    `${GHL_API_BASE}/contacts/search/duplicate?${searchParams}`,
    {
      method: "GET",
      headers: getGhlHeaders(apiKey),
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { contact?: { id?: string }; id?: string };
  return data?.contact?.id ?? data?.id ?? null;
}

export async function findDuplicateContactByEmail(
  apiKey: string,
  locationId: string,
  email: string,
): Promise<string | null> {
  const normalized = normalizeEmailForGhl(email);
  if (!normalized) return null;
  const params = new URLSearchParams({
    locationId,
    email: normalized,
  });
  return requestDuplicateContactId(apiKey, params);
}

export async function findDuplicateContactByPhone(
  apiKey: string,
  locationId: string,
  phone: string,
): Promise<string | null> {
  return findDuplicateContactIdByPhoneVariants(apiKey, locationId, phone);
}

export async function findDuplicateContact(
  apiKey: string,
  locationId: string,
  email: string,
): Promise<string | null> {
  return findDuplicateContactByEmail(apiKey, locationId, email);
}

export type ResolvedPurchaseContacts = {
  targetId: string | null;
  idByEmail: string | null;
  idByPhone: string | null;
  /** Email and phone each matched a contact, and those contacts differ. */
  phoneConflictWithDifferentContact: boolean;
};

export async function resolvePurchaseContactIds(
  apiKey: string,
  locationId: string,
  email: string,
  phone: string | undefined,
): Promise<ResolvedPurchaseContacts> {
  const idByEmail = await findDuplicateContactByEmail(apiKey, locationId, email);
  const idByPhone = phone
    ? await findDuplicateContactIdByPhoneVariants(apiKey, locationId, phone)
    : null;
  const idCombined =
    phone?.trim() && email
      ? await findDuplicateContactIdByEmailAndPhoneVariants(
          apiKey,
          locationId,
          email,
          phone,
        )
      : null;

  const both = idByEmail && idByPhone;
  const phoneConflictWithDifferentContact = !!(
    both &&
    idByEmail !== idByPhone
  );

  const targetId =
    both && idByEmail !== idByPhone
      ? idByEmail
      : idByEmail ?? idByPhone ?? idCombined ?? null;

  return {
    targetId,
    idByEmail,
    idByPhone,
    phoneConflictWithDifferentContact,
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

function isGhlDuplicateError(status: number, message: unknown): boolean {
  if (status !== 400) return false;
  const m = ghlApiMessageToString(message, "").toLowerCase();
  return (
    m.includes("duplicate") ||
    m.includes("does not allow duplicated") ||
    m.includes("already exists")
  );
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

  const err = (await res.json().catch(() => ({}))) as { message?: unknown };
  const message = ghlApiMessageToString(err.message, res.statusText);
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

async function putContactAndEnsurePurchaseTags(
  apiKey: string,
  contactId: string,
  email: string,
  input: PurchaseContactInput,
  omitPhone: boolean,
): Promise<void> {
  const existing = await fetchContactById(apiKey, contactId);
  const existingTags = normalizeTags(existing?.tags);

  const firstName = pickMergedField(existing?.firstName, input.firstName);
  const lastName = pickMergedField(existing?.lastName, input.lastName);
  const phoneMerged = pickMergedField(existing?.phone, input.phone);

  // GHL rejects `locationId` on PUT /contacts/:id (422: should not exist).
  const putBody: Record<string, string> = {
    email,
  };
  if (firstName?.trim()) putBody.firstName = firstName.trim();
  if (lastName?.trim()) putBody.lastName = lastName.trim();
  if (!omitPhone && phoneMerged?.trim()) putBody.phone = phoneMerged.trim();

  const putRes = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: "PUT",
    headers: getGhlHeaders(apiKey),
    body: JSON.stringify(putBody),
  });

  if (!putRes.ok && !omitPhone) {
    const errJson = (await putRes.json().catch(() => ({}))) as {
      message?: unknown;
    };
    const msg = ghlApiMessageToString(errJson.message, putRes.statusText);
    const low = msg.toLowerCase();
    if (
      low.includes("phone") ||
      low.includes("duplicate") ||
      low.includes("already exists")
    ) {
      return putContactAndEnsurePurchaseTags(
        apiKey,
        contactId,
        email,
        input,
        true,
      );
    }
    throw new Error(`GHL update contact failed (${putRes.status}): ${msg}`);
  }

  if (!putRes.ok) {
    const errJson = (await putRes.json().catch(() => ({}))) as {
      message?: unknown;
    };
    const msg = ghlApiMessageToString(errJson.message, putRes.statusText);
    throw new Error(`GHL update contact failed (${putRes.status}): ${msg}`);
  }

  for (const tag of PURCHASE_TAGS) {
    if (existingTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      continue;
    }
    const ok = await addTag(apiKey, contactId, tag);
    if (!ok) {
      console.error(`[ghl] addTag failed for ${tag} on contact ${contactId}`);
    }
  }
}

export async function upsertGhlContactFromPurchase(
  input: PurchaseContactInput,
): Promise<void> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    throw new Error("GHL_API_KEY and GHL_LOCATION_ID must be set");
  }

  const email = normalizeEmailForGhl(input.email);
  if (!email) {
    throw new Error("Email is required for GHL upsert");
  }

  const resolved = await resolvePurchaseContactIds(
    apiKey,
    locationId,
    email,
    input.phone,
  );

  if (resolved.phoneConflictWithDifferentContact) {
    console.warn(
      "[ghl] book party: email and phone match different GHL contacts; using email contact, omitting phone on update",
    );
  }

  if (resolved.targetId) {
    await putContactAndEnsurePurchaseTags(
      apiKey,
      resolved.targetId,
      email,
      input,
      resolved.phoneConflictWithDifferentContact,
    );
    return;
  }

  const res = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: "POST",
    headers: getGhlHeaders(apiKey),
    body: JSON.stringify({
      email,
      locationId,
      firstName: input.firstName?.trim() || undefined,
      lastName: input.lastName?.trim() || undefined,
      phone: normalizePhoneForGhl(input.phone) ?? undefined,
      tags: [...PURCHASE_TAGS],
      source: PURCHASE_SOURCE,
    }),
  });

  if (res.ok) {
    return;
  }

  const err = (await res.json().catch(() => ({}))) as { message?: unknown };
  const message = ghlApiMessageToString(err.message, res.statusText);

  if (isGhlDuplicateError(res.status, message)) {
    for (const delayMs of [200, 500]) {
      await new Promise((r) => setTimeout(r, delayMs));
      const again = await resolvePurchaseContactIds(
        apiKey,
        locationId,
        email,
        input.phone,
      );
      if (again.targetId) {
        if (again.phoneConflictWithDifferentContact) {
          console.warn(
            "[ghl] book party: email and phone match different GHL contacts; using email contact, omitting phone on update",
          );
        }
        await putContactAndEnsurePurchaseTags(
          apiKey,
          again.targetId,
          email,
          input,
          again.phoneConflictWithDifferentContact,
        );
        return;
      }
    }

    if (normalizePhoneForGhl(input.phone)) {
      const resNoPhone = await fetch(`${GHL_API_BASE}/contacts/`, {
        method: "POST",
        headers: getGhlHeaders(apiKey),
        body: JSON.stringify({
          email,
          locationId,
          firstName: input.firstName?.trim() || undefined,
          lastName: input.lastName?.trim() || undefined,
          tags: [...PURCHASE_TAGS],
          source: PURCHASE_SOURCE,
        }),
      });
      if (resNoPhone.ok) {
        return;
      }
      const errNp = (await resNoPhone.json().catch(() => ({}))) as {
        message?: unknown;
      };
      const msgNp = ghlApiMessageToString(errNp.message, resNoPhone.statusText);
      if (isGhlDuplicateError(resNoPhone.status, msgNp)) {
        await new Promise((r) => setTimeout(r, 200));
        const last = await resolvePurchaseContactIds(
          apiKey,
          locationId,
          email,
          input.phone,
        );
        if (last.targetId) {
          if (last.phoneConflictWithDifferentContact) {
            console.warn(
              "[ghl] book party: email and phone match different GHL contacts; using email contact, omitting phone on update",
            );
          }
          await putContactAndEnsurePurchaseTags(
            apiKey,
            last.targetId,
            email,
            input,
            last.phoneConflictWithDifferentContact,
          );
          return;
        }
      }
    }
  }

  throw new Error(`GHL create contact failed (${res.status}): ${message}`);
}
