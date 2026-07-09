import { Plus } from 'lucide-react';
import type { PublicMenuProductDto } from '@pos/api-client';
import { formatMoney } from '@/lib/format';

interface ProductCardProps {
  product: PublicMenuProductDto;
  currency: string;
  quantity: number;
  onAdd: () => void;
}

export function ProductCard({ product, currency, quantity, onAdd }: ProductCardProps) {
  return (
    <article className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-100">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-24 w-24 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-2xl font-semibold text-zinc-400">
          {product.name.charAt(0)}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold leading-tight text-zinc-900">{product.name}</h3>
          {product.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
          ) : null}
          <p className="mt-2 text-base font-bold text-zinc-900">{formatMoney(product.price, currency)}</p>
        </div>

        {quantity > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-primary">{quantity} in cart</span>
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm active:scale-[0.98]"
              aria-label={`Add another ${product.name}`}
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-white shadow-sm active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            Add
          </button>
        )}
      </div>
    </article>
  );
}
