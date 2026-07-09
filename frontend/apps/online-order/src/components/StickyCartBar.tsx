import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cartItemCount, cartTotal, getCart, type CartLine } from '@/lib/cart';
import { formatMvr } from '@/lib/format';

export function StickyCartBar() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const sync = () => setLines(getCart(slug));
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('cart-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('cart-updated', sync);
    };
  }, [slug]);

  const count = cartItemCount(lines);
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white px-4 py-3 shadow-[0_-4px_20px_rgb(0_0_0/0.08)]">
      <Link
        to={`/${slug}/cart`}
        className="tap-target flex w-full items-center justify-between gap-3 rounded-xl bg-neutral-900 px-5 py-3.5 text-white active:bg-neutral-800"
      >
        <span className="font-medium">
          View cart · {count} {count === 1 ? 'item' : 'items'}
        </span>
        <span className="text-lg font-semibold">{formatMvr(cartTotal(lines))}</span>
      </Link>
    </div>
  );
}

export function notifyCartUpdated() {
  window.dispatchEvent(new Event('cart-updated'));
}
