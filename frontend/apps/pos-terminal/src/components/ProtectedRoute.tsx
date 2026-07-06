import { Navigate, Outlet } from 'react-router-dom';
import { usePos } from '../auth';
import { Spinner } from '@pos/ui';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = usePos();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function ShiftRequiredRoute() {
  const { shift } = usePos();
  if (!shift || shift.status !== 'Open') return <Navigate to="/shift" replace />;
  return <Outlet />;
}
