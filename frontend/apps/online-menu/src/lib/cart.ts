import type { PublicMenuProductDto } from '@pos/api-client';
import { ORDER_URL } from './config';

export const CART_STORAGE_KEY = 'bluraypos:online-cart';

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  taxRate: number;
  quantity: number;
}

export interface OnlineCart {
  slug: string;
  storeId?: string;
  storeName?: string;
  currency: string;
  serviceType?: 'DineIn' | 'Pickup' | 'Delivery';
  diningTableId?: string;
  tableName?: string;
  qrToken?: string;
  lines: CartLine[];
  updatedAt: string;
}

export function loadCart(): OnlineCart | null {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnlineCart;
    return parsed?.slug ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCart(cart: OnlineCart): void {
  sessionStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({ ...cart, updatedAt: new Date().toISOString() }),
  );
}

export function clearCart(): void {
  sessionStorage.removeItem(CART_STORAGE_KEY);
}

export function getCartItemCount(cart: OnlineCart | null): number {
  return cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
}

export function createCart(params: {
  slug: string;
  currency: string;
  storeId?: string;
  storeName?: string;
  serviceType?: OnlineCart['serviceType'];
  diningTableId?: string;
  tableName?: string;
  qrToken?: string;
}): OnlineCart {
  const existing = loadCart();
  if (existing?.slug === params.slug) {
    return {
      ...existing,
      ...params,
      lines: existing.lines,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    slug: params.slug,
    currency: params.currency,
    storeId: params.storeId,
    storeName: params.storeName,
    serviceType: params.serviceType,
    diningTableId: params.diningTableId,
    tableName: params.tableName,
    qrToken: params.qrToken,
    lines: [],
    updatedAt: new Date().toISOString(),
  };
}

export function addToCart(cart: OnlineCart, product: PublicMenuProductDto): OnlineCart {
  const lines = [...cart.lines];
  const index = lines.findIndex((line) => line.productId === product.id);

  if (index >= 0) {
    lines[index] = { ...lines[index], quantity: lines[index].quantity + 1 };
  } else {
    lines.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      taxRate: product.taxRate,
      quantity: 1,
    });
  }

  return { ...cart, lines, updatedAt: new Date().toISOString() };
}

export function getLineQuantity(cart: OnlineCart | null, productId: string): number {
  return cart?.lines.find((line) => line.productId === productId)?.quantity ?? 0;
}

export function redirectToOrder(cart: OnlineCart): void {
  saveCart(cart);
  const base = ORDER_URL.replace(/\/$/, '');
  window.location.href = `${base}/${cart.slug}`;
}
