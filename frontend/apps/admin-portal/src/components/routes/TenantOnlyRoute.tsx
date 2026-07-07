import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useIsPosFrontStaff } from '@/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlertIcon } from 'lucide-react';

/** Store owners / managers only — no platform operations. */
export function TenantOnlyRoute() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const isPosFrontStaff = useIsPosFrontStaff();
  const location = useLocation();

  if (isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isPosFrontStaff) {
    if (!hasPermission('Order.View')) {
      return (
        <div className="flex h-screen items-center justify-center p-8">
          <Alert className="max-w-md" variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Your role uses the POS terminal. Contact your manager if you need admin portal access.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    const allowed = ['/orders'];
    const isAllowed = allowed.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));
    if (!isAllowed) {
      return <Navigate to="/orders" replace />;
    }
  }

  return <Outlet />;
}
