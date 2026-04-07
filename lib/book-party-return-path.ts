const PREFIX = "/htns-book-party";

/** Allowed Stripe return paths (pathname only; query added by Stripe). */
const ALLOWED_RETURN_SUFFIXES = ["", "/vip"] as const;

/**
 * Validates pathname-only return URLs for Stripe (no open redirects).
 */
export function isValidBookPartyReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (!path.startsWith(PREFIX)) return false;
  const rest = path.slice(PREFIX.length);
  if (!ALLOWED_RETURN_SUFFIXES.includes(rest as (typeof ALLOWED_RETURN_SUFFIXES)[number])) {
    return false;
  }
  if (path.includes("..")) return false;
  if (path.includes("?") || path.includes("#")) return false;
  // Reject scheme-relative or protocol tricks
  if (path.startsWith("//")) return false;
  return true;
}
