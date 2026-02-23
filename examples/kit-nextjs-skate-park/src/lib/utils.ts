/**
 * Get base URL for the application.
 * When host is provided (e.g. from request headers), uses it so deployed URLs are correct.
 * Otherwise uses NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_BASE_URL, then localhost.
 *
 * @param host - Optional host from request (e.g. headers.get('host'))
 * @returns Base URL string
 */
export function getBaseUrl(host?: string | null): string {
  if (host) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${host}`;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}

/**
 * Get full URL by combining base URL with path
 *
 * @param path - Path segment (e.g. '/about')
 * @param host - Optional host from request
 * @returns Full URL string
 */
export function getFullUrl(path: string, host?: string | null): string {
  const baseUrl = getBaseUrl(host);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
