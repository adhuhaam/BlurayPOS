import { LayoutGridIcon } from 'lucide-react';
import { Button } from '@pos/ui';
import { usePos } from '../auth';

export function TablesPage() {
  const { store } = usePos();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
      <LayoutGridIcon className="size-12 text-text-muted" />
      <div>
        <h1 className="text-xl font-bold text-text">Tables &amp; areas</h1>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          Floor plan for <strong>{store?.name}</strong> is coming soon — assign orders to tables and dining areas.
        </p>
      </div>
      <Button onClick={() => window.location.assign('/')}>Back to POS</Button>
    </div>
  );
}
