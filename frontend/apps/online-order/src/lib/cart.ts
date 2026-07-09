export interface CartLine {
  productId: string;
  name: string;
  price: number;
  taxRate: number;
  quantity: number;
  imageUrl?: string | null;
}

const STORAGE_PREFIX = 'online-order-cart:';

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

export function getCart(slug: string): CartLine[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(slug: string, lines: CartLine[]): void {
  if (lines.length === 0) {
    localStorage.removeItem(storageKey(slug));
    return;
  }
  localStorage.setItem(storageKey(slug), JSON.stringify(lines));
}

export function clearCart(slug: string): void {
  localStorage.removeItem(storageKey(slug));
}

export function hasCartItems(slug: string): boolean {
  return getCart(slug).length > 0;
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function cartTax(lines: CartLine[]): number {
  return lines.reduce(
    (sum, line) => sum + line.price * line.quantity * (line.taxRate / 100),
    0,
  );
}

export function cartTotal(lines: CartLine[]): number {
  return cartSubtotal(lines) + cartTax(lines);
}

export function addToCart(slug: string, item: Omit<CartLine, 'quantity'>, qty = 1): CartLine[] {
  const lines = getCart(slug);
  const existing = lines.find((l) => l.productId === item.productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    lines.push({ ...item, quantity: qty });
  }
  saveCart(slug, lines);
  return lines;
}

export function updateCartLineQuantity(slug: string, productId: string, quantity: number): CartLine[] {
  const lines = getCart(slug)
    .map((line) => (line.productId === productId ? { ...line, quantity } : line))
    .filter((line) => line.quantity > 0);
  saveCart(slug, lines);
  return lines;
}

export function removeFromCart(slug: string, productId: string): CartLine[] {
  const lines = getCart(slug).filter((line) => line.productId !== productId);
  saveCart(slug, lines);
  return lines;
}

export function toOrderLines(lines: CartLine[]) {
  return lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    unitPrice: line.price,
  }));
}
