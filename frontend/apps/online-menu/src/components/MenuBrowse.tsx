import { useEffect, useMemo, useState } from 'react';
import { api, type PublicMenuCategoryDto, type PublicStoreProfileDto } from '@pos/api-client';
import { CategoryChips } from './CategoryChips';
import { ProductCard } from './ProductCard';
import { StickyCartBar } from './StickyCartBar';
import {
  addToCart,
  createCart,
  getCartItemCount,
  getLineQuantity,
  loadCart,
  redirectToOrder,
  saveCart,
  type OnlineCart,
} from '@/lib/cart';

export interface TableContext {
  tableId: string;
  tableName: string;
  areaName?: string | null;
  qrToken: string;
}

interface MenuBrowseProps {
  slug: string;
  store: PublicStoreProfileDto;
  table?: TableContext;
}

export function MenuBrowse({ slug, store, table }: MenuBrowseProps) {
  const [storeId, setStoreId] = useState<string | undefined>(store.branches[0]?.id);
  const [categories, setCategories] = useState<PublicMenuCategoryDto[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<OnlineCart | null>(null);

  useEffect(() => {
    const branch = store.branches.find((item) => item.id === storeId) ?? store.branches[0];
    const nextCart = createCart({
      slug,
      currency: store.currency,
      storeId: branch?.id,
      storeName: branch?.name,
      serviceType: table ? 'DineIn' : undefined,
      diningTableId: table?.tableId,
      tableName: table?.tableName,
      qrToken: table?.qrToken,
    });
    setCart(nextCart);
  }, [slug, store, storeId, table]);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      setMenuLoading(true);
      setMenuError(null);

      try {
        const menu = await api.getPublicMenu(slug, storeId);
        if (!cancelled) setCategories(menu);
      } catch (err) {
        if (!cancelled) {
          setMenuError(err instanceof Error ? err.message : 'Failed to load menu.');
          setCategories([]);
        }
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }

    void loadMenu();
    return () => {
      cancelled = true;
    };
  }, [slug, storeId]);

  const visibleCategories = useMemo(() => {
    if (!activeCategoryId) return categories;
    return categories.filter((category) => category.id === activeCategoryId);
  }, [categories, activeCategoryId]);

  const itemCount = getCartItemCount(cart);
  const existingCart = loadCart();
  const showBranchPicker = store.branches.length > 1;

  function handleAdd(product: PublicMenuCategoryDto['products'][number]) {
    if (!cart) return;
    const next = addToCart(cart, product);
    setCart(next);
    saveCart(next);
  }

  function handleOrderNow() {
    if (!cart || itemCount === 0) return;
    redirectToOrder(cart);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-zinc-50 pb-28">
      <header className="bg-white px-4 pb-4 pt-6 shadow-sm ring-1 ring-zinc-100">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Menu</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{store.organizationName}</h1>
        {store.onlineMenuWelcomeText ? (
          <p className="mt-2 text-sm text-zinc-600">{store.onlineMenuWelcomeText}</p>
        ) : null}

        {table ? (
          <div className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
            <p className="font-semibold">Table {table.tableName}</p>
            {table.areaName ? <p className="text-primary/80">{table.areaName}</p> : null}
          </div>
        ) : null}

        {showBranchPicker ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Branch</span>
            <select
              value={storeId ?? ''}
              onChange={(event) => setStoreId(event.target.value || undefined)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm font-medium text-zinc-900"
            >
              {store.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </header>

      <main className="px-4 pt-4">
        <CategoryChips
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />

        {menuLoading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading items…</p>
        ) : menuError ? (
          <p className="py-12 text-center text-sm text-red-600">{menuError}</p>
        ) : (
          <div className="mt-4 space-y-6">
            {visibleCategories.map((category) => (
              <section key={category.id} id={`category-${category.id}`}>
                {activeCategoryId === null ? (
                  <h2 className="mb-3 text-lg font-semibold text-zinc-900">{category.name}</h2>
                ) : null}
                <div className="space-y-3">
                  {category.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currency={store.currency}
                      quantity={getLineQuantity(cart ?? existingCart, product.id)}
                      onAdd={() => handleAdd(product)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {visibleCategories.every((category) => category.products.length === 0) ? (
              <p className="py-12 text-center text-sm text-zinc-500">No items in this category yet.</p>
            ) : null}
          </div>
        )}
      </main>

      <StickyCartBar itemCount={itemCount} onOrderNow={handleOrderNow} />
    </div>
  );
}
