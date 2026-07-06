import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireRole } from './components/RequireRole';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { StoresPage } from './pages/StoresPage';
import { TransfersPage } from './pages/TransfersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UsersPage } from './pages/UsersPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { BillingPage } from './pages/BillingPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuppliesPage } from './pages/SuppliesPage';
import { Toaster } from '@/components/ui/sonner';

function LoginRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="supplies" element={<SuppliesPage />} />
              <Route path="stores" element={<StoresPage />} />
              <Route path="transfers" element={<TransfersPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route element={<RequireRole roles={['OrgAdmin', 'SuperAdmin']} />}>
                <Route path="users" element={<UsersPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route element={<RequireRole roles={['SuperAdmin']} />}>
                <Route path="organizations" element={<OrganizationsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

