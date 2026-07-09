import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { addToCart, getCart, hasCartItems } from '@/lib/cart';
import { formatMvr } from '@/lib/format';
import { useStore } from '@/context/StoreContext';
import { notifyCartUpdated } from '@/components/StickyCartBar';

export function CatalogPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { store, menu, loading, error, selectedStoreId, setSelectedStoreId } = useStore();
  const [addedId, setAddedId] = useState<string | null>(null);

  const isRetail = store?.businessType === 'Retail';

  if (!loading && isRetail && hasCartItems(slug)) {
    return <Navigate to={`/${slug}/cart`} replace />;
  }

  const handleAdd = (product: {
    id: string;
    name: string;
    price: number;
    taxRate: number;
    imageUrl: string | null;
  }) => {
    addToCart(slug, {
      productId: product.id,
      name: product.name,
      price: product.price,
      taxRate: product.taxRate,
      imageUrl: product.imageUrl,
    });
    notifyCartUpdated();
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1200);
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Store not found</h1>
        <p className="text-neutral-600">{error ?? 'This store is not available.'}</p>
      </div>
    );
  }

  const catalogLabel = isRetail ? 'Shop' : 'Menu';

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur">
        <h1 className="text-xl font-bold">{store.organizationName}</h1>
        {store.onlineMenuWelcomeText && (
          <p className="mt-1 text-sm text-neutral-600">{store.onlineMenuWelcomeText}</p>
        )}
        {store.branches.length > 1 && (
          <div className="mt-3">
            <label htmlFor="branch" className="mb-1 block text-sm font-medium text-neutral-700">
              Branch
            </label>
            <select
              id="branch"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="tap-target w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5"
            >
              {store.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <main className="px-4 py-4">
        {!store.onlineOrderingEnabled && (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Online ordering is not available right now. You can browse the {catalogLabel.toLowerCase()}.
          </p>
        )}

        {menu.length === 0 ? (
          <p className="py-12 text-center text-neutral-500">Nothing to show yet.</p>
        ) : (
          menu.map((category) => (
            <section key={category.id} className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">{category.name}</h2>
              <ul className="space-y-3">
                {category.products.map((product) => (
                  <li
                    key={product.id}
                    className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-2xl">
                        🍽
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <p className="font-medium leading-snug">{product.name}</p>
                        {product.description && (
                          <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600">
                            {product.description}
                          </p>
                        )}
                        <p className="mt-1 font-semibold text-neutral-900">
                          {formatMvr(product.price)}
                        </p>
                      </div>
                      {store.onlineOrderingEnabled && (
                        <button
                          type="button"
                          onClick={() => handleAdd(product)}
                          className="tap-target mt-2 self-start rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white active:bg-neutral-800"
                        >
                          {addedId === product.id ? 'Added ✓' : 'Add to cart'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>

      {getCart(slug).length > 0 && (
        <div className="px-4 pb-4">
          <Link
            to={`/${slug}/cart`}
            className="tap-target block rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center font-medium text-neutral-900"
          >
            Go to cart
          </Link>
        </div>
      )}
    </div>
  );
}
