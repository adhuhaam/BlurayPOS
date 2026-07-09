import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  cartItemCount,
  cartSubtotal,
  cartTax,
  cartTotal,
  getCart,
  removeFromCart,
  updateCartLineQuantity,
  type CartLine,
} from '@/lib/cart';
import { formatMvr } from '@/lib/format';
import { useStore } from '@/context/StoreContext';
import { notifyCartUpdated } from '@/components/StickyCartBar';

export function CartPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { store, loading } = useStore();
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(getCart(slug));
  }, [slug]);

  const sync = (next: CartLine[]) => {
    setLines(next);
    notifyCartUpdated();
  };

  const count = cartItemCount(lines);
  const subtotal = cartSubtotal(lines);
  const tax = cartTax(lines);
  const total = cartTotal(lines);
  const minOrder = store?.minOrderAmount ?? 0;
  const belowMin = minOrder > 0 && subtotal < minOrder;

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <header className="mb-6 flex items-center gap-3">
        <Link to={`/${slug}`} className="tap-target flex items-center text-neutral-600">
          ← Back
        </Link>
        <h1 className="text-xl font-bold">Your cart</h1>
      </header>

      {lines.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-neutral-600">Your cart is empty.</p>
          <Link
            to={`/${slug}`}
            className="tap-target mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-medium text-white"
          >
            Browse {store?.businessType === 'Retail' ? 'catalog' : 'menu'}
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li
                key={line.productId}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{line.name}</p>
                  <p className="text-sm text-neutral-600">{formatMvr(line.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="tap-target flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-lg"
                    onClick={() =>
                      sync(updateCartLineQuantity(slug, line.productId, line.quantity - 1))
                    }
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{line.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="tap-target flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-lg"
                    onClick={() =>
                      sync(updateCartLineQuantity(slug, line.productId, line.quantity + 1))
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Remove item"
                  className="tap-target px-2 text-sm text-red-600"
                  onClick={() => sync(removeFromCart(slug, line.productId))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span>{formatMvr(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Tax</span>
              <span>{formatMvr(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{formatMvr(total)}</span>
            </div>
            {belowMin && (
              <p className="text-sm text-amber-700">
                Minimum order is {formatMvr(minOrder)}. Add more items to continue.
              </p>
            )}
          </div>

          <p className="mt-2 text-center text-sm text-neutral-500">
            {count} {count === 1 ? 'item' : 'items'}
          </p>

          <button
            type="button"
            disabled={belowMin || !store?.onlineOrderingEnabled}
            onClick={() => navigate(`/${slug}/checkout`)}
            className="tap-target mt-6 w-full rounded-xl bg-neutral-900 px-5 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to checkout
          </button>
        </>
      )}
    </div>
  );
}
