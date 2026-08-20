/**
 * Where to send someone after they sign in. The value comes from a query
 * string, so it is treated as hostile: only a plain in-app path is allowed.
 * "//evil.com" and "https://evil.com" both fall back to /app rather than
 * handing an attacker a redirect off the site.
 */
export function safeNextPath(next: string | undefined, fallback = "/app"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}
