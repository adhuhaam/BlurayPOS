import { ShoppingBag } from 'lucide-react';

interface StickyCartBarProps {
  itemCount: number;
  onOrderNow: () => void;
}

export function StickyCartBar({ itemCount, onOrderNow }: StickyCartBarProps) {
  const hasItems = itemCount > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div
        className="mx-auto flex max-w-lg items-center gap-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              hasItems ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900">
              {hasItems ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Your cart is empty'}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {hasItems ? 'Tap Order now to checkout' : 'Add items to get started'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOrderNow}
          disabled={!hasItems}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-base font-semibold text-white shadow-sm transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Order now
        </button>
      </div>
    </div>
  );
}
