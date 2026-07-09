import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { api, type PublicMenuCategoryDto, type PublicStoreProfileDto } from '@pos/api-client';

interface StoreContextValue {
  slug: string;
  store: PublicStoreProfileDto | null;
  menu: PublicMenuCategoryDto[];
  selectedStoreId: string;
  loading: boolean;
  error: string | null;
  setSelectedStoreId: (id: string) => void;
  refreshMenu: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const [store, setStore] = useState<PublicStoreProfileDto | null>(null);
  const [menu, setMenu] = useState<PublicMenuCategoryDto[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      setLoading(true);
      setError(null);
      try {
        const profile = await api.getPublicStore(slug);
        if (cancelled) return;
        setStore(profile);
        const branchId = profile.branches[0]?.id ?? '';
        setSelectedStoreId(branchId);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load store');
          setStore(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) void loadStore();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const refreshMenu = async () => {
    if (!slug || !selectedStoreId) return;
    const categories = await api.getPublicMenu(slug, selectedStoreId);
    setMenu(categories);
  };

  useEffect(() => {
    if (!slug || !selectedStoreId) return;
    let cancelled = false;

    async function loadMenu() {
      try {
        const categories = await api.getPublicMenu(slug, selectedStoreId);
        if (!cancelled) setMenu(categories);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load menu');
        }
      }
    }

    void loadMenu();
    return () => {
      cancelled = true;
    };
  }, [slug, selectedStoreId]);

  return (
    <StoreContext.Provider
      value={{
        slug,
        store,
        menu,
        selectedStoreId,
        loading,
        error,
        setSelectedStoreId,
        refreshMenu,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
