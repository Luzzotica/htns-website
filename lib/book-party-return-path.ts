const PREFIX = "/htns-book-party";

/**
 * Validates pathname-only return URLs for Stripe (no open redirects).
 */
export function isValidBookPartyReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (!path.startsWith(PREFIX)) return false;
  if (path.includes("..")) return false;
  if (path.includes("?") || path.includes("#")) return false;
  // Reject scheme-relative or protocol tricks
  if (path.startsWith("//")) return false;
  return true;
}
