/** sessionStorage key set after successful free registration (before VIP upsell). */
export const BOOK_PARTY_REGISTERED_STORAGE_KEY = "htns_bp_registered";

/** GHL funnel entry — marketing + free registration (home page CTA, “details & register”). */
export const BOOK_PARTY_FUNNEL_ENTRY_URL =
  "https://funnels.howtonotsuck.com/book-party-register";

/** GHL funnel page for VIP checkout (matches email links). */
export const BOOK_PARTY_VIP_FUNNEL_URL =
  "https://funnels.howtonotsuck.com/book-party-vip";

/** Stripe Checkout `metadata.funnel` for VIP upsell (GHL / analytics). */
export const BOOK_PARTY_CHECKOUT_FUNNEL = "book_party_vip";
