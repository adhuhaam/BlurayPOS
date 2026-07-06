import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlertIcon } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles.includes('Cashier') && !roles.some((r) => ['StoreManager', 'OrgAdmin', 'SuperAdmin'].includes(r))) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <Alert className="max-w-md" variant="destructive">
          <ShieldAlertIcon />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Cashier accounts cannot access the admin portal. Use the POS terminal instead.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <Outlet />;
}
