import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TenantOnlyRoute } from '@/components/routes/TenantOnlyRoute';
import { HrLayout } from '@hr/layouts/HrLayout';
import { HrModuleGate } from '@hr/components/HrAccessGate';
import { HrLoginPage } from '@hr/pages/HrLoginPage';
import { HrDashboardPage } from '@/pages/hr/HrDashboardPage';
import { HrEmployeesPage } from '@/pages/hr/HrEmployeesPage';
import { HrEmployeeDetailPage } from '@/pages/hr/HrEmployeeDetailPage';
import { HrPayrollPage } from '@/pages/hr/HrPayrollPage';
import { HrPaySlipPage } from '@/pages/hr/HrPaySlipPage';
import { HrAttendancePage } from '@/pages/hr/HrAttendancePage';
import { HrLeavePage } from '@/pages/hr/HrLeavePage';
import { HrSchedulingPage } from '@/pages/hr/HrSchedulingPage';
import { Toaster } from '@/components/ui/sonner';

function LoginRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <HrLoginPage />;
}

function HrShell({ children }: { children: React.ReactNode }) {
  return <HrModuleGate>{children}</HrModuleGate>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<TenantOnlyRoute />}>
              <Route element={<HrLayout />}>
                <Route index element={<HrShell><HrDashboardPage /></HrShell>} />
                <Route path="employees" element={<HrShell><HrEmployeesPage /></HrShell>} />
                <Route path="employees/:id" element={<HrShell><HrEmployeeDetailPage /></HrShell>} />
                <Route path="payroll" element={<HrShell><HrPayrollPage /></HrShell>} />
                <Route path="payslips/:id" element={<HrShell><HrPaySlipPage /></HrShell>} />
                <Route path="attendance" element={<HrShell><HrAttendancePage /></HrShell>} />
                <Route path="leave" element={<HrShell><HrLeavePage /></HrShell>} />
                <Route path="scheduling" element={<HrShell><HrSchedulingPage /></HrShell>} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
