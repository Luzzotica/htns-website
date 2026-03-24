import { DateTime } from "luxon";

export type BookPartyPricingState = {
  configured: boolean;
  /** ISO instant when early bird pricing ends (start of eventDate − 7 days in BOOK_PARTY_TIMEZONE). */
  earlyBirdEndsAtISO: string | null;
  isEarlyBird: boolean;
};

/**
 * Early bird is active for all instants strictly before the start of calendar day (eventDate − 7 days) in BOOK_PARTY_TIMEZONE.
 */
export function getBookPartyPricingState(
  now: Date = new Date(),
): BookPartyPricingState {
  const eventDateStr = process.env.BOOK_PARTY_EVENT_DATE?.trim();
  const tz = process.env.BOOK_PARTY_TIMEZONE?.trim() || "America/Chicago";

  if (!eventDateStr) {
    return {
      configured: false,
      earlyBirdEndsAtISO: null,
      isEarlyBird: true,
    };
  }

  const eventDay = DateTime.fromISO(eventDateStr, { zone: tz }).startOf("day");
  if (!eventDay.isValid) {
    return {
      configured: false,
      earlyBirdEndsAtISO: null,
      isEarlyBird: true,
    };
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

export function getStripePriceIdForBookParty(): string {
  const early = process.env.STRIPE_PRICE_BOOK_PARTY_EARLY?.trim();
  const regular = process.env.STRIPE_PRICE_BOOK_PARTY_REGULAR?.trim();
  if (!early || !regular) {
    throw new Error(
      "STRIPE_PRICE_BOOK_PARTY_EARLY and STRIPE_PRICE_BOOK_PARTY_REGULAR must be set",
    );
  }
  const { isEarlyBird } = getBookPartyPricingState();
  return isEarlyBird ? early : regular;
}
