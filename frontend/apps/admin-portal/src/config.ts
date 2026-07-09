const POS_URL = import.meta.env.VITE_POS_URL ?? 'http://localhost:5173';
const MARKETING_URL = import.meta.env.VITE_MARKETING_URL ?? 'http://localhost:5175';
const OFFICE_URL = import.meta.env.VITE_OFFICE_URL ?? 'http://localhost:5174';
const COUPONS_URL = import.meta.env.VITE_COUPONS_URL ?? 'http://localhost:5176';
const MENU_URL = import.meta.env.VITE_MENU_URL ?? 'http://localhost:5178';
const ORDER_URL = import.meta.env.VITE_ORDER_URL ?? 'http://localhost:5177';

export const links = {
  pos: POS_URL,
  marketing: MARKETING_URL,
  office: OFFICE_URL.replace(/\/$/, ''),
};

/** Customer-facing public sites (preview / QR links from Office pages). */
export const moduleUrls = {
  coupons: COUPONS_URL.replace(/\/$/, ''),
  menu: MENU_URL.replace(/\/$/, ''),
  order: ORDER_URL.replace(/\/$/, ''),
};

export function menuUrlForSlug(slug: string): string {
  return `${moduleUrls.menu}/${slug}`;
}

export function orderUrlForSlug(slug: string): string {
  return `${moduleUrls.order}/${slug}`;
}

export const appConfig = {
  name: 'BlurayPOS Office',
  tagline: 'Manage your restaurant, menu, staff & sales',
};
