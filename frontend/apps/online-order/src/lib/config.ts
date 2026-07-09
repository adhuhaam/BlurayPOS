/** Base URL for the online ordering app (share links, redirects). */
export const ORDER_URL = import.meta.env.VITE_ORDER_URL ?? 'http://localhost:5177';

/** Base URL for menu-only browsing (defaults to same app). */
export const MENU_URL = import.meta.env.VITE_MENU_URL ?? 'http://localhost:5177';

export function orderUrlForSlug(slug: string): string {
  return `${ORDER_URL.replace(/\/$/, '')}/${slug}`;
}

export function trackUrlForSlug(slug: string, token: string): string {
  return `${ORDER_URL.replace(/\/$/, '')}/${slug}/track/${token}`;
}
