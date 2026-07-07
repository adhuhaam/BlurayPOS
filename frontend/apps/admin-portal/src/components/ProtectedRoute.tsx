import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { Skeleton } from '@/components/ui/skeleton';

/** Requires authentication. Cashier / tenant checks live in TenantOnlyRoute. */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
