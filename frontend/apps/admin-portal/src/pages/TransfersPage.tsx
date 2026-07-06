import { useEffect, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { api, type StockTransferDto, type StoreDto, type ProductDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransferDto[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ fromStoreId: '', toStoreId: '', productId: '', quantity: '' });

  const load = async () => {
    setLoading(true);
    const [t, s, p] = await Promise.all([api.getStockTransfers(), api.getStores(), api.getProducts({ pageSize: 200 })]);
    setTransfers(t);
    setStores(s);
    setProducts(p.items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await api.createStockTransfer({
        fromStoreId: form.fromStoreId, toStoreId: form.toStoreId,
        productId: form.productId, quantity: Number(form.quantity),
      });
      toast.success('Transfer created');
      setModalOpen(false);
      load();
    } catch {
      toast.error('Failed to create transfer');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.completeStockTransfer(id);
      toast.success('Transfer completed');
      load();
    } catch {
      toast.error('Failed to complete transfer');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Transfers"
        description="Move inventory between stores"
        action={<Button onClick={() => setModalOpen(true)}><PlusIcon data-icon="inline-start" />New Transfer</Button>}
      />
      {loading ? <Skeleton className="h-64" /> : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.productName}</TableCell>
                  <TableCell>{t.fromStoreName}</TableCell>
                  <TableCell>{t.toStoreName}</TableCell>
                  <TableCell>{t.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'Completed' ? 'secondary' : t.status === 'Pending' ? 'outline' : 'destructive'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.status === 'Pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleComplete(t.id)}>Complete</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <FormSelect label="From Store" value={form.fromStoreId} onValueChange={(v) => setForm({ ...form, fromStoreId: v })} options={[{ value: '', label: 'Select' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]} />
            <FormSelect label="To Store" value={form.toStoreId} onValueChange={(v) => setForm({ ...form, toStoreId: v })} options={[{ value: '', label: 'Select' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]} />
            <FormSelect label="Product" value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })} options={[{ value: '', label: 'Select' }, ...products.map((p) => ({ value: p.id, label: p.name }))]} />
            <div className="flex flex-col gap-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
