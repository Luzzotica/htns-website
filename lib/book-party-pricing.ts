export type BookPartyProduct = "boat-and-hotel" | "hotel-only";

export const BOAT_SEATS_TOTAL = 96;

/** Display amounts for UI (keep in sync with Stripe regular price). */
export type ProductPricing = {
  regularCents: number;
};

export const PRODUCTS: Record<BookPartyProduct, ProductPricing> = {
  /** VIP: boat + hotel. Update `regularCents` when you change Stripe. */
  "boat-and-hotel": { regularCents: 20000 },
  /** Legacy webhook resolution only (no longer sold on site). */
  "hotel-only": { regularCents: 7500 },
};

/** First matching env wins. Supports legacy `STRIPE_PRICE_BOOK_PARTY_*` names. */
function stripePriceIdFromEnv(keys: string[]): string {
  for (const key of keys) {
    const id = process.env[key]?.trim();
    if (id) return id;
  }
  throw new Error(`One of [${keys.join(", ")}] must be set`);
}

/**
 * VIP checkout: boat + hotel only, always the regular Stripe price (no early bird).
 */
export function getBookPartyVipStripePriceId(): string {
  return stripePriceIdFromEnv([
    "STRIPE_PRICE_BOAT_AND_HOTEL_REGULAR",
    "STRIPE_PRICE_BOOK_PARTY_REGULAR",
  ]);
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
