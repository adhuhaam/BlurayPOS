import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth';

/** Super Admin only — platform management routes. */
export function PlatformOnlyRoute() {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
