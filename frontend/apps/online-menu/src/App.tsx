import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MenuPage } from './pages/MenuPage';
import { TableMenuPage } from './pages/TableMenuPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:slug/t/:qrToken" element={<TableMenuPage />} />
        <Route path="/:slug" element={<MenuPage />} />
      </Routes>
    </BrowserRouter>
  );
}
