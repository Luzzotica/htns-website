import { DateTime } from "luxon";

export type BookPartyProduct = "boat-and-hotel" | "hotel-only";

export const BOAT_SEATS_TOTAL = 96;

export type ProductPricing = {
  earlyBirdCents: number;
  regularCents: number;
};

export const PRODUCTS: Record<BookPartyProduct, ProductPricing> = {
  "boat-and-hotel": { earlyBirdCents: 15000, regularCents: 20000 },
  "hotel-only": { earlyBirdCents: 5000, regularCents: 7500 },
};

export type BookPartyPricingState = {
  configured: boolean;
  earlyBirdEndsAtISO: string | null;
  isEarlyBird: boolean;
};

/**
 * Early bird is active for all instants strictly before the start of
 * calendar day (eventDate − 7 days) in BOOK_PARTY_TIMEZONE.
 */
export function getBookPartyPricingState(
  now: Date = new Date(),
): BookPartyPricingState {
  const eventDateStr = process.env.BOOK_PARTY_EVENT_DATE?.trim();
  const tz = process.env.BOOK_PARTY_TIMEZONE?.trim() || "America/Chicago";

  if (!eventDateStr) {
    return { configured: false, earlyBirdEndsAtISO: null, isEarlyBird: true };
  }

  const eventDay = DateTime.fromISO(eventDateStr, { zone: tz }).startOf("day");
  if (!eventDay.isValid) {
    return { configured: false, earlyBirdEndsAtISO: null, isEarlyBird: true };
  }

  const earlyBirdEnd = eventDay.minus({ days: 7 });
  const nowLocal = DateTime.fromJSDate(now).setZone(tz);
  const isEarlyBird = nowLocal < earlyBirdEnd;

  return {
    configured: true,
    earlyBirdEndsAtISO: earlyBirdEnd.toISO(),
    isEarlyBird,
  };
}

/** First matching env wins. Supports legacy `STRIPE_PRICE_BOOK_PARTY_*` names. */
function stripePriceIdFromEnv(keys: string[]): string {
  for (const key of keys) {
    const id = process.env[key]?.trim();
    if (id) return id;
  }
  throw new Error(`One of [${keys.join(", ")}] must be set`);
}

export function getStripePriceId(product: BookPartyProduct): string {
  const { isEarlyBird } = getBookPartyPricingState();

  if (product === "boat-and-hotel") {
    return stripePriceIdFromEnv(
      isEarlyBird
        ? ["STRIPE_PRICE_BOAT_AND_HOTEL_EARLY", "STRIPE_PRICE_BOOK_PARTY_EARLY"]
        : [
            "STRIPE_PRICE_BOAT_AND_HOTEL_REGULAR",
            "STRIPE_PRICE_BOOK_PARTY_REGULAR",
          ],
    );
  }

  return stripePriceIdFromEnv(
    isEarlyBird
      ? ["STRIPE_PRICE_HOTEL_ONLY_EARLY", "STRIPE_PRICE_BOOK_PARTY_EARLY"]
      : ["STRIPE_PRICE_HOTEL_ONLY_REGULAR", "STRIPE_PRICE_BOOK_PARTY_REGULAR"],
  );
}

const ALL_PRICE_ENV_KEYS: Array<{
  env: string;
  product: BookPartyProduct;
}> = [
  { env: "STRIPE_PRICE_BOAT_AND_HOTEL_EARLY", product: "boat-and-hotel" },
  { env: "STRIPE_PRICE_BOAT_AND_HOTEL_REGULAR", product: "boat-and-hotel" },
  { env: "STRIPE_PRICE_BOOK_PARTY_EARLY", product: "boat-and-hotel" },
  { env: "STRIPE_PRICE_BOOK_PARTY_REGULAR", product: "boat-and-hotel" },
  { env: "STRIPE_PRICE_HOTEL_ONLY_EARLY", product: "hotel-only" },
  { env: "STRIPE_PRICE_HOTEL_ONLY_REGULAR", product: "hotel-only" },
];

export function resolveProductFromPriceId(
  priceId: string | undefined,
): BookPartyProduct | null {
  if (!priceId) return null;
  for (const { env, product } of ALL_PRICE_ENV_KEYS) {
    if (process.env[env]?.trim() === priceId) return product;
  }
  return null;
}
