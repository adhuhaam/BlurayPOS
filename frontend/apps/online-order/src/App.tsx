import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from '@/context/StoreContext';
import { StoreLayout } from '@/components/StoreLayout';
import { CatalogPage } from '@/pages/CatalogPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { TrackPage } from '@/pages/TrackPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/demo" replace />} />
        <Route
          path="/:slug"
          element={
            <StoreProvider>
              <StoreLayout />
            </StoreProvider>
          }
        >
          <Route index element={<CatalogPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="track/:token" element={<TrackPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
