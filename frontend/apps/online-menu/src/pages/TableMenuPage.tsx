import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { api, type PublicStoreProfileDto } from '@pos/api-client';
import { MenuBrowse } from '@/components/MenuBrowse';

export function TableMenuPage() {
  const { slug, qrToken } = useParams<{ slug: string; qrToken: string }>();
  const [store, setStore] = useState<PublicStoreProfileDto | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [redirectSlug, setRedirectSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !qrToken) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const table = await api.getPublicTable(qrToken);
        if (cancelled) return;

        if (table.storeSlug !== slug) {
          setRedirectSlug(table.storeSlug);
          return;
        }

        const profile = await api.getPublicStore(table.storeSlug);
        if (cancelled) return;

        if (!profile.onlineMenuEnabled) {
          setError('Online menu is not available for this restaurant.');
        }

        setStore(profile);
        setTableName(table.tableName);
        setTableId(table.tableId);
        setAreaName(table.areaName);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Table or menu not found.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, qrToken]);

  if (redirectSlug && qrToken) {
    return <Navigate to={`/${redirectSlug}/t/${qrToken}`} replace />;
  }

  if (!slug || !qrToken) {
    return <StatusScreen message="Invalid table link." />;
  }

  if (loading) {
    return <StatusScreen message="Loading your table menu…" />;
  }

  if (error || !store || !tableName || !tableId) {
    return <StatusScreen message={error ?? 'Table not found.'} />;
  }

  if (!store.onlineMenuEnabled) {
    return <StatusScreen message="Online menu is not available for this restaurant." />;
  }

  return (
    <MenuBrowse
      slug={slug}
      store={store}
      table={{
        tableId,
        tableName,
        areaName,
        qrToken,
      }}
    />
  );
}

function StatusScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-6">
      <p className="text-center text-sm text-zinc-600">{message}</p>
    </div>
  );
}
