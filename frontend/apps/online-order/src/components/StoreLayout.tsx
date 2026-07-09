import { Outlet, useLocation } from 'react-router-dom';
import { StickyCartBar } from './StickyCartBar';

export function StoreLayout() {
  const { pathname } = useLocation();
  const showCartBar =
    !pathname.includes('/cart') &&
    !pathname.includes('/checkout') &&
    !pathname.includes('/track/');

  return (
    <div className={`min-h-dvh ${showCartBar ? 'pb-24' : ''}`}>
      <Outlet />
      {showCartBar && <StickyCartBar />}
    </div>
  );
}
