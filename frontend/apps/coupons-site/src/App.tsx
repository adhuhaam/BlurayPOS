import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScanPage } from './pages/ScanPage';
import { ThanksPage } from './pages/ThanksPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/s/:code" element={<ScanPage />} />
        <Route path="/thanks" element={<ThanksPage />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center text-slate-600">
            Scan a coupon QR code to enter.
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
