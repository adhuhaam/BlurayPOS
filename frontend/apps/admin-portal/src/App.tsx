import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, useIsPosFrontStaff } from './auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PlatformOnlyRoute } from './components/routes/PlatformOnlyRoute';
import { TenantOnlyRoute } from './components/routes/TenantOnlyRoute';
import { RequireRole } from './components/RequireRole';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PlatformDashboardPage } from './pages/PlatformDashboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlansPage } from './pages/PlansPage';
import { TenantsPage } from './pages/TenantsPage';
import { PlatformUsersPage } from './pages/PlatformUsersPage';
import { PlatformSettingsPage } from './pages/PlatformSettingsPage';
import { PlatformReportsPage } from './pages/PlatformReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliesPage } from './pages/SuppliesPage';
import { StoresPage } from './pages/StoresPage';
import { TransfersPage } from './pages/TransfersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { OrdersPage } from './pages/OrdersPage';
import { UsersPage } from './pages/UsersPage';
import { BillingPage } from './pages/BillingPage';
import { OnlineMenuModuleGate } from './components/OnlineMenuModuleGate';
import { OnlineMenuPage } from './pages/OnlineMenuPage';
import { OnlineOrderingPage } from './pages/OnlineOrderingPage';
import { CouponsModuleGate } from './components/CouponsModuleGate';
import { OnlineOrderingModuleGate } from './components/OnlineOrderingModuleGate';
import { HrModuleGate } from './components/HrModuleGate';
import { CouponsDashboardPage } from './pages/CouponsDashboardPage';
import { CouponCampaignNewPage, CouponCampaignDetailPage } from './pages/CouponCampaignPages';
import { CouponPrintPage } from './pages/CouponPrintPage';
import { SettingsPage } from './pages/SettingsPage';
import { DiningTablesPage } from './pages/DiningTablesPage';
import { HrDashboardPage } from './pages/hr/HrDashboardPage';
import { HrEmployeesPage } from './pages/hr/HrEmployeesPage';
import { HrEmployeeDetailPage } from './pages/hr/HrEmployeeDetailPage';
import { HrPayrollPage } from './pages/hr/HrPayrollPage';
import { HrPaySlipPage } from './pages/hr/HrPaySlipPage';
import { HrAttendancePage } from './pages/hr/HrAttendancePage';
import { HrLeavePage } from './pages/hr/HrLeavePage';
import { HrSchedulingPage } from './pages/hr/HrSchedulingPage';
import { Toaster } from '@/components/ui/sonner';

function LoginRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />;
}

function RegisterRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />;
}

function HomePage() {
  const { isSuperAdmin } = useAuth();
  const isPosFrontStaff = useIsPosFrontStaff();
  if (isPosFrontStaff) return <Navigate to="/orders" replace />;
  return isSuperAdmin ? <PlatformDashboardPage /> : <DashboardPage />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/register" element={<RegisterRedirect />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/coupons/:id/print/:batchId" element={<CouponPrintPage />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/organizations" element={<Navigate to="/tenants" replace />} />
          <Route path="/stores" element={<Navigate to="/branches" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<HomePage />} />

              {/* ── Super Admin: platform only ── */}
              <Route element={<PlatformOnlyRoute />}>
                <Route path="plans" element={<PlansPage />} />
                <Route path="reports" element={<PlatformReportsPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="platform-users" element={<PlatformUsersPage />} />
                <Route path="platform-settings" element={<PlatformSettingsPage />} />
              </Route>

              {/* ── Store owners / managers: operations only ── */}
              <Route element={<TenantOnlyRoute />}>
                <Route path="orders" element={<OrdersPage />} />
                <Route element={<RequireRole roles={['OrgAdmin', 'StoreManager']} />}>
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="tables" element={<DiningTablesPage />} />
                  <Route path="online-menu" element={<OnlineMenuModuleGate><OnlineMenuPage /></OnlineMenuModuleGate>} />
                  <Route path="online-ordering" element={<OnlineOrderingModuleGate><OnlineOrderingPage /></OnlineOrderingModuleGate>} />
                </Route>
                <Route path="supplies" element={<SuppliesPage />} />
                <Route path="branches" element={<StoresPage />} />
                <Route path="transfers" element={<TransfersPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route element={<RequireRole roles={['OrgAdmin']} />}>
                  <Route path="users" element={<UsersPage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route element={<RequireRole roles={['OrgAdmin', 'StoreManager']} />}>
                  <Route path="coupons" element={<CouponsModuleGate><CouponsDashboardPage /></CouponsModuleGate>} />
                  <Route path="coupons/new" element={<CouponsModuleGate><CouponCampaignNewPage /></CouponsModuleGate>} />
                  <Route path="coupons/:id" element={<CouponsModuleGate><CouponCampaignDetailPage /></CouponsModuleGate>} />
                  <Route path="hr" element={<HrModuleGate><HrDashboardPage /></HrModuleGate>} />
                  <Route path="hr/employees" element={<HrModuleGate><HrEmployeesPage /></HrModuleGate>} />
                  <Route path="hr/employees/:id" element={<HrModuleGate><HrEmployeeDetailPage /></HrModuleGate>} />
                  <Route path="hr/payroll" element={<HrModuleGate><HrPayrollPage /></HrModuleGate>} />
                  <Route path="hr/payslips/:id" element={<HrModuleGate><HrPaySlipPage /></HrModuleGate>} />
                  <Route path="hr/attendance" element={<HrModuleGate><HrAttendancePage /></HrModuleGate>} />
                  <Route path="hr/leave" element={<HrModuleGate><HrLeavePage /></HrModuleGate>} />
                  <Route path="hr/scheduling" element={<HrModuleGate><HrSchedulingPage /></HrModuleGate>} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
