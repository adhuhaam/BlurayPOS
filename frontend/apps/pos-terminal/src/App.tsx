import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PosProvider, usePos } from './auth';
import { ProtectedRoute, ShiftRequiredRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ShiftPage } from './pages/ShiftPage';
import { PosPage } from './pages/PosPage';
import { OrdersPage } from './pages/OrdersPage';
import { initTheme } from '@pos/ui';

initTheme();

function LoginRedirect() {
  const { isAuthenticated } = usePos();
  return isAuthenticated ? <Navigate to="/shift" replace /> : <LoginPage />;
}

export function App() {
  return (
    <PosProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/shift" element={<ShiftPage />} />
            <Route element={<ShiftRequiredRoute />}>
              <Route index element={<PosPage />} />
              <Route path="orders" element={<OrdersPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </PosProvider>
  );
}
