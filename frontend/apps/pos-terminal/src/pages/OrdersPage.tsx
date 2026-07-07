import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BanIcon, RefreshCwIcon } from 'lucide-react';
import { api, ApiError, type OrderDto } from '@pos/api-client';
import { usePos, usePosPermission } from '../auth';
import { Button, Modal } from '@pos/ui';

export function OrdersPage() {
  const navigate = useNavigate();
  const { storeId } = usePos();
  const canVoid = usePosPermission('Sale.Void');
  const canEdit = usePosPermission('Sale.Edit');
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrderDto | null>(null);

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const result = await api.getOrders({ storeId, pageSize: 50 });
      setOrders(result.items.filter((o) => o.status === 'Draft' || o.status === 'Held'));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [storeId]);

  const voidOrder = async (order: OrderDto) => {
    if (!confirm(`Void order #${order.orderNumber}?`)) return;
    try {
      await api.voidOrder(order.id);
      setSelected(null);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Cannot void order');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Open Orders</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit ? 'Edit drafts from the register' : 'View only'}
            {!canVoid && ' · Void requires manager permission'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
          <Link to="/" className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm">Back to POS</Link>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground">No draft or held orders.</p>
        ) : (
          <div className="grid gap-2">
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                className="flex items-center justify-between rounded-lg border p-4 text-left hover:bg-muted/50"
                onClick={() => setSelected(o)}
              >
                <div>
                  <p className="font-medium">#{o.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{o.lines.length} items · {o.status}</p>
                </div>
                <span className="font-semibold">${o.total.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </main>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Order #${selected.orderNumber}` : ''}>
        {selected && (
          <div className="flex flex-col gap-4">
            <ul className="text-sm">
              {selected.lines.map((l) => (
                <li key={l.id} className="flex justify-between border-b py-2">
                  <span>{l.quantity}× {l.productName}</span>
                  <span>${l.lineTotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="font-semibold">Total: ${selected.total.toFixed(2)}</p>
            <div className="flex gap-2">
              {canVoid && (
                <Button variant="danger" onClick={() => voidOrder(selected)}>Void</Button>
              )}
              {canEdit && (
                <Button variant="secondary" onClick={() => { setSelected(null); navigate('/'); }}>Resume in POS</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
