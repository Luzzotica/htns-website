import { NextResponse } from "next/server";
import { emailSchema } from "@/lib/validations";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const TAG = "from website";
const SOURCE = "htns-website";

function getHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_API_VERSION,
  };
}

async function findDuplicateContact(
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
      headers: getHeaders(apiKey),
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
    headers: getHeaders(apiKey),
    body: JSON.stringify({ tags: [tag] }),
  });
  return res.ok;
}

async function addTag(
  apiKey: string,
  contactId: string,
  tag: string,
): Promise<boolean> {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({ tags: [tag] }),
  });
  return res.ok;
}

async function updateExistingContact(
  apiKey: string,
  locationId: string,
  email: string,
): Promise<void> {
  const contactId = await findDuplicateContact(apiKey, locationId, email);
  if (!contactId) {
    throw new Error("Could not find existing contact to update");
  }
  await removeTag(apiKey, contactId, TAG);
  const added = await addTag(apiKey, contactId, TAG);
  if (!added) {
    throw new Error("Could not add tag to existing contact");
  }
}

async function createOrUpdateGhlContact(email: string) {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    throw new Error("GHL_API_KEY and GHL_LOCATION_ID must be set");
  }

  const res = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      email,
      locationId,
      tags: [TAG],
      source: SOURCE,
    }),
  });

  if (res.ok) {
    return res.json();
  }

  const err = (await res.json().catch(() => ({}))) as { message?: string };
  const message = err.message ?? res.statusText;
  const isDuplicate =
    res.status === 400 &&
    (message.toLowerCase().includes("duplicate") ||
      message.toLowerCase().includes("does not allow duplicated"));

  if (isDuplicate) {
    await updateExistingContact(apiKey, locationId, email);
    return;
  }

  throw new Error(`GHL API error (${res.status}): ${message}`);
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

    await createOrUpdateGhlContact(email);

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
