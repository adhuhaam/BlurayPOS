import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ProductDto, type OrganizationDto } from '@pos/api-client';
import {
  cacheProducts,
  getCachedProducts,
  getCachedProductByBarcode,
  addToOutbox,
  syncAll,
  useOnlineStatus,
} from '@pos/offline-sync';
import { Button, Input, Modal, ThemeToggle } from '@pos/ui';
import { usePos, usePosPermission } from '../auth';
import { StatusBar } from '../components/StatusBar';
import { ReceiptView } from '../components/ReceiptView';
import { usePosHub } from '../hooks/usePosHub';
import type { OrderDto } from '@pos/api-client';

interface CartItem {
  product: ProductDto;
  quantity: number;
}

export function PosPage() {
  const { store, storeId, logout, tenantFeatures } = usePos();
  const retailMode = tenantFeatures?.posBarcodeRetail && !tenantFeatures?.posTables;
  const restaurantMode = tenantFeatures?.posTables && !tenantFeatures?.posBarcodeRetail;
  const canViewOrders = usePosPermission('Order.View');
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'BankTransfer'>('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [slipPath, setSlipPath] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const slipInputRef = useRef<HTMLInputElement>(null);
  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<OrderDto | null>(null);
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    if (retailMode) barcodeRef.current?.focus();
  }, [retailMode]);

  useEffect(() => {
    if (online) api.getOrganization().then(setOrg).catch(() => {});
  }, [online]);

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    if (online) {
      try {
        const result = await api.getProducts({ storeId, pageSize: 200, search: search || undefined });
        setProducts(result.items);
        await cacheProducts(result.items);
      } catch {
        const cached = await getCachedProducts(search || undefined);
        setProducts(cached);
      }
    } else {
      const cached = await getCachedProducts(search || undefined);
      setProducts(cached);
    }
  }, [storeId, search, online]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleInventoryUpdate = useCallback((productId: string, quantityOnHand: number) => {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stockOnHand: quantityOnHand } : p));
  }, []);

  usePosHub(storeId, handleInventoryUpdate);

  useEffect(() => {
    if (online && storeId) syncAll(storeId).catch(() => {});
  }, [online, storeId]);

  const addToCart = (product: ProductDto) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const handleBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    let product = products.find((p) => p.barcode === barcode);
    if (!product) {
      product = await getCachedProductByBarcode(barcode);
    }
    if (product) addToCart(product);
    setBarcode('');
    barcodeRef.current?.focus();
  };

  const subtotal = cart.reduce((sum, c) => {
    const price = c.product.storePrice ?? c.product.basePrice;
    return sum + price * c.quantity;
  }, 0);

  const tax = cart.reduce((sum, c) => {
    const price = c.product.storePrice ?? c.product.basePrice;
    return sum + price * c.quantity * c.product.taxRate;
  }, 0);

  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'BankTransfer' && !slipPath) return;
    setLoading(true);

    const lines = cart.map((c) => ({
      productId: c.product.id,
      quantity: c.quantity,
      unitPrice: c.product.storePrice ?? c.product.basePrice,
    }));

    const orderRequest = { lines };
    const paymentAmount = paymentMethod === 'Cash' ? Number(amountTendered) || total : total;
    const payment = {
      method: paymentMethod,
      amount: paymentAmount,
      slipImagePath: paymentMethod === 'BankTransfer' ? slipPath ?? undefined : undefined,
    };

    try {
      let order: OrderDto;

      if (online) {
        order = await api.createOrder(orderRequest);
        order = await api.completeOrder(order.id, { payments: [payment] });
      } else {
        await addToOutbox('Order', 'Sale', {
          order: { lines },
          completion: { payments: [payment] },
        });
        order = {
          id: crypto.randomUUID(),
          orderNumber: `OFF-${Date.now()}`,
          status: 'Completed',
          subtotal,
          taxAmount: tax,
          discountAmount: 0,
          total,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          lines: cart.map((c, i) => ({
            id: String(i),
            productId: c.product.id,
            productName: c.product.name,
            sku: c.product.sku,
            quantity: c.quantity,
            unitPrice: c.product.storePrice ?? c.product.basePrice,
            taxRate: c.product.taxRate,
            discountAmount: 0,
            lineTotal: (c.product.storePrice ?? c.product.basePrice) * c.quantity * (1 + c.product.taxRate),
          })),
          payments: [{ id: '1', method: paymentMethod, status: 'Completed', amount: total, reference: null, slipImagePath: slipPath }],
        };
      }

      setReceipt(order);
      setCart([]);
      setCheckoutOpen(false);
      setAmountTendered('');
      setSlipPath(null);
      setSlipFileName(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSlipUpload = async (file: File) => {
    setUploadingSlip(true);
    try {
      const result = await api.uploadFile(file);
      setSlipPath(result.path);
      setSlipFileName(file.name);
    } finally {
      setUploadingSlip(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex h-screen flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-text">{store?.name}</h1>
          <p className="text-sm text-text-muted">
            {retailMode ? 'Retail — scan barcode to sell' : restaurantMode ? 'Restaurant — tap items to add' : 'POS Terminal'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBar />
          <ThemeToggle />
          {tenantFeatures?.posTables && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/tables')}>Tables</Button>
          )}
          {canViewOrders && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/orders')}>Orders</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate('/shift')}>Shift</Button>
          <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <div className={`mb-3 flex gap-2 ${retailMode ? 'flex-col sm:flex-row' : ''}`}>
            {!retailMode && (
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
            )}
            {(tenantFeatures?.posBarcodeRetail ?? true) && (
              <form onSubmit={handleBarcode} className={retailMode ? 'w-full' : 'flex-1'}>
                <Input
                  ref={barcodeRef}
                  placeholder={retailMode ? 'Scan barcode to add item…' : 'Scan barcode...'}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className={retailMode ? 'text-lg' : undefined}
                  autoFocus={retailMode}
                />
              </form>
            )}
            {retailMode && (
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.filter((p) => p.isActive).map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-border bg-surface-elevated p-3 text-center transition-colors hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95"
              >
                <span className="text-sm font-semibold text-text line-clamp-2">{p.name}</span>
                <span className="mt-1 text-lg font-bold text-primary-600">
                  ${(p.storePrice ?? p.basePrice).toFixed(2)}
                </span>
                {p.stockOnHand != null && (
                  <span className="text-xs text-text-muted">Stock: {p.stockOnHand}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <aside className="flex w-80 flex-col border-l border-border bg-surface-elevated lg:w-96">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold text-text">Cart ({cart.length})</h2>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-4">
            {cart.map((item) => (
              <li key={item.product.id} className="flex items-center justify-between rounded-lg bg-surface p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{item.product.name}</p>
                  <p className="text-xs text-text-muted">
                    ${(item.product.storePrice ?? item.product.basePrice).toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-border text-lg font-bold">−</button>
                  <span className="w-6 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white">+</button>
                </div>
              </li>
            ))}
            {cart.length === 0 && (
              <p className="text-center text-text-muted">Cart is empty</p>
            )}
          </ul>
          <div className="border-t border-border p-4">
            <div className="mb-2 flex justify-between text-sm text-text-muted">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="mb-2 flex justify-between text-sm text-text-muted">
              <span>Tax</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="mb-4 flex justify-between text-xl font-bold text-text">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => { setAmountTendered(total.toFixed(2)); setCheckoutOpen(true); }}
            >
              Checkout
            </Button>
          </div>
        </aside>
      </div>

      <Modal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Checkout"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={handleCheckout} loading={loading} disabled={paymentMethod === 'BankTransfer' && !slipPath}>Complete Sale</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-2xl font-bold text-text">Total: ${total.toFixed(2)}</p>
          <div className="flex gap-2">
            {(['Cash', 'Card', 'BankTransfer'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${
                  paymentMethod === m
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-border text-text'
                }`}
              >
                {m === 'BankTransfer' ? 'Bank' : m}
              </button>
            ))}
          </div>
          {paymentMethod === 'BankTransfer' && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm text-text-muted">{org?.paymentInstructions ?? 'Scan QR or transfer, then upload slip.'}</p>
              <input ref={slipInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSlipUpload(f); }} />
              {slipPath ? (
                <p className="text-sm text-green-600">Slip uploaded: {slipFileName}</p>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => slipInputRef.current?.click()} disabled={uploadingSlip}>
                  {uploadingSlip ? 'Uploading...' : 'Upload Transfer Slip'}
                </Button>
              )}
            </div>
          )}
          {paymentMethod === 'Cash' && (
            <Input
              label="Amount Tendered"
              type="number"
              step="0.01"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
            />
          )}
          {paymentMethod === 'Cash' && Number(amountTendered) >= total && (
            <p className="text-lg text-green-600">
              Change: ${(Number(amountTendered) - total).toFixed(2)}
            </p>
          )}
        </div>
      </Modal>

      {receipt && (
        <ReceiptView
          order={receipt}
          storeName={store?.name ?? 'Store'}
          paymentQrPayload={org?.paymentQrPayload ?? null}
          paymentInstructions={org?.paymentInstructions ?? null}
          onClose={() => setReceipt(null)}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
