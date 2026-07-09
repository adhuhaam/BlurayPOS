import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type PublicStoreProfileDto } from '@pos/api-client';
import { MenuBrowse } from '@/components/MenuBrowse';

export function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<PublicStoreProfileDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const profile = await api.getPublicStore(slug);
        if (cancelled) return;

        if (!profile.onlineMenuEnabled) {
          setError('Online menu is not available for this restaurant.');
        }

        setStore(profile);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load menu.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) {
    return <StatusScreen message="Invalid menu link." />;
  }

  if (loading) {
    return <StatusScreen message="Loading menu…" />;
  }

  if (error || !store) {
    return <StatusScreen message={error ?? 'Menu not found.'} />;
  }

  if (!store.onlineMenuEnabled) {
    return <StatusScreen message="Online menu is not available for this restaurant." />;
  }

  return <MenuBrowse slug={slug} store={store} />;
}

function StatusScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-6">
      <p className="text-center text-sm text-zinc-600">{message}</p>
    </div>
  );
}
