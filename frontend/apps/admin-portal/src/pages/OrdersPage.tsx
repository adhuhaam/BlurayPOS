import { useEffect, useState } from 'react';
import { BanIcon, ExternalLinkIcon, RefreshCwIcon } from 'lucide-react';
import { api, ApiError, type OrderDto, type StoreDto, type OrderStatus } from '@pos/api-client';
import { useAuth, usePermission } from '@/auth';
import { links } from '@/config';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: '', label: 'All open' },
  { value: 'Submitted', label: 'Online — awaiting action' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Held', label: 'Held' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Voided', label: 'Voided' },
];

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Completed') return 'default';
  if (status === 'Voided') return 'destructive';
  if (status === 'Held') return 'outline';
  return 'secondary';
}

export function OrdersPage() {
  const { hasPermission, user } = useAuth();
  const canVoid = usePermission('Sale.Void');
  const canEdit = usePermission('Sale.Edit');
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('Submitted');
  const [source, setSource] = useState('Online');
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const result = await api.getOrders({
        storeId,
        status: (status || undefined) as OrderStatus | undefined,
        orderSource: source || undefined,
        pageSize: 100,
      });
      setOrders(result.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getStores().then((s) => {
      setStores(s);
      const preferred = user?.defaultStoreId && s.some((x) => x.id === user.defaultStoreId)
        ? user.defaultStoreId
        : s[0]?.id ?? '';
      if (preferred) setStoreId(preferred);
    });
  }, [user?.defaultStoreId]);

  useEffect(() => { load(); }, [storeId, status, source]);

  const acceptOrder = async (order: OrderDto) => {
    try {
      await api.acceptOnlineOrder(order.id);
      toast.success(`Order #${order.orderNumber} accepted`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to accept');
    }
  };

  const verifyPayment = async (order: OrderDto) => {
    try {
      await api.verifyOnlinePayment(order.id);
      toast.success(`Payment verified for #${order.orderNumber}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to verify');
    }
  };

  const rejectOrder = async (order: OrderDto) => {
    const reason = prompt('Reason for rejection (shown to customer):');
    if (!reason) return;
    try {
      await api.rejectOnlineOrder(order.id, reason);
      toast.success(`Order #${order.orderNumber} rejected`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reject');
    }
  };

  const slipUrl = (order: OrderDto) => {
    const slip = order.payments.find((p) => p.slipImagePath)?.slipImagePath;
    return slip ? api.getFileUrl(slip) : null;
  };

  const voidOrder = async (order: OrderDto) => {
    if (!confirm(`Void order #${order.orderNumber}?`)) return;
    try {
      await api.voidOrder(order.id);
      toast.success(`Order #${order.orderNumber} voided`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Cannot void this order');
    }
  };

  if (!hasPermission('Order.View')) {
    return (
      <div>
        <PageHeader title="Orders" />
        <p className="text-muted-foreground">You do not have permission to view orders.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="View and manage open orders — edit drafts in POS, void with manager permission"
        action={
          <Button variant="outline" asChild>
            <a href={links.pos} target="_blank" rel="noreferrer">
              <ExternalLinkIcon data-icon="inline-start" />
              Open POS
            </a>
          </Button>
        }
      />

      <Alert>
        <AlertDescription className="text-sm">
          {canEdit ? 'You can edit draft orders from the POS terminal.' : 'Your role can view orders but not edit them.'}
          {' '}
          {canVoid ? 'You may void draft or held orders.' : 'Voiding orders requires manager approval.'}
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-end gap-4">
        <FormSelect label="Branch" value={storeId} onValueChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} className="min-w-48" />
        <FormSelect label="Status" value={status} onValueChange={setStatus} options={STATUS_OPTIONS} className="min-w-40" />
        <FormSelect label="Source" value={source} onValueChange={setSource} options={[
          { value: 'Online', label: 'Online orders' },
          { value: '', label: 'All sources' },
          { value: 'Pos', label: 'POS only' },
        ]} className="min-w-40" />
        <Button variant="outline" size="sm" className="mb-0.5" onClick={load}>
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {loading ? <Skeleton className="h-64" /> : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No orders found for this filter.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell><Badge variant={statusVariant(o.status)}>{o.status}</Badge></TableCell>
                  <TableCell>{formatCurrency(o.total)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{o.lines.length}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {o.status === 'Submitted' && o.orderSource && o.orderSource !== 'Pos' && (
                      <>
                        {o.onlinePaymentMethod === 'BankTransfer' && slipUrl(o) && (
                          <Button variant="link" size="sm" asChild>
                            <a href={slipUrl(o)!} target="_blank" rel="noreferrer">View slip</a>
                          </Button>
                        )}
                        {o.onlinePaymentMethod === 'BankTransfer' ? (
                          <Button variant="default" size="sm" onClick={() => verifyPayment(o)}>Verify & confirm</Button>
                        ) : (
                          <Button variant="default" size="sm" onClick={() => acceptOrder(o)}>Accept</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => rejectOrder(o)}>Reject</Button>
                      </>
                    )}
                    {(o.status === 'Draft' || o.status === 'Held') && canVoid && (
                      <Button variant="ghost" size="sm" onClick={() => voidOrder(o)}>
                        <BanIcon data-icon="inline-start" />
                        Void
                      </Button>
                    )}
                    {(o.status === 'Draft' || o.status === 'Held') && canEdit && (
                      <Button variant="link" size="sm" asChild>
                        <a href={links.pos} target="_blank" rel="noreferrer">
                          Edit in POS
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
