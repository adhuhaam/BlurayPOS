import { Link } from 'react-router-dom';
import { AlertTriangleIcon } from 'lucide-react';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';

export function SubscriptionReadOnlyBanner() {
  const { subscription, isSuperAdmin } = useAuth();

  if (isSuperAdmin || !subscription?.isReadOnly) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangleIcon className="size-4 shrink-0 text-amber-600" />
        <span>
          Your subscription has expired. The store is in <strong>read-only</strong> mode until renewal is verified.
        </span>
      </div>
      <Button size="sm" variant="outline" render={<Link to="/billing" />}>
        Renew subscription
      </Button>
    </div>
  );
}
