import { useEffect, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { api, type InventoryItemDto, type StoreDto } from '@pos/api-client';
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

export function InventoryPage() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantityChange: '', reason: '' });

  useEffect(() => {
    api.getStores().then((s) => { setStores(s); if (s.length > 0) setStoreId(s[0].id); });
  }, []);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    api.getInventory(storeId, lowStockOnly).then(setItems).finally(() => setLoading(false));
  }, [storeId, lowStockOnly]);

  const handleAdjust = async () => {
    try {
      await api.adjustInventory(storeId, {
        productId: adjustForm.productId,
        quantityChange: Number(adjustForm.quantityChange),
        reason: adjustForm.reason,
      });
      toast.success('Inventory adjusted');
      setAdjustOpen(false);
      setAdjustForm({ productId: '', quantityChange: '', reason: '' });
      setItems(await api.getInventory(storeId, lowStockOnly));
    } catch {
      toast.error('Failed to adjust inventory');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Track stock levels per store"
        action={<Button onClick={() => setAdjustOpen(true)} disabled={!storeId}><PlusIcon data-icon="inline-start" />Adjust Stock</Button>}
      />
      <div className="flex flex-wrap items-end gap-4">
        <FormSelect
          label="Store"
          value={storeId}
          onValueChange={setStoreId}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
          className="min-w-48"
        />
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="rounded border-input" />
          Low stock only
        </label>
      </div>
      {loading ? <Skeleton className="h-64" /> : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reorder</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.quantityOnHand}</TableCell>
                  <TableCell>{item.reorderLevel}</TableCell>
                  <TableCell>
                    <Badge variant={item.isLowStock ? 'destructive' : 'secondary'}>
                      {item.isLowStock ? 'Low' : 'OK'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Inventory</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <FormSelect
              label="Product"
              value={adjustForm.productId}
              onValueChange={(v) => setAdjustForm({ ...adjustForm, productId: v })}
              options={[{ value: '', label: 'Select product' }, ...items.map((i) => ({ value: i.productId, label: i.productName }))]}
            />
            <div className="flex flex-col gap-2"><Label>Quantity Change (+/-)</Label><Input type="number" value={adjustForm.quantityChange} onChange={(e) => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Reason</Label><Input value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjust}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
