import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth';

export function RequireRole({ roles, children }: { roles: string[]; children?: React.ReactNode }) {
  const { roles: userRoles } = useAuth();
  const allowed = roles.some((r) => userRoles.includes(r));

  if (!allowed) {
    return (
      <Navigate to="/" replace />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
