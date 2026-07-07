import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { api, ApiError, type InventoryItemDto, type StoreDto, type ProductDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { CatalogWorkflowBanner } from '@/components/catalog-workflow-banner';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function InventoryPage() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [retailProducts, setRetailProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantityChange: '', reason: '' });

  useEffect(() => {
    api.getStores().then((s) => { setStores(s); if (s.length > 0) setStoreId(s[0].id); });
  }, []);

  const loadInventory = async () => {
    if (!storeId) return;
    setLoading(true);
    const [inv, prods] = await Promise.all([
      api.getInventory(storeId, lowStockOnly),
      api.getProducts({ pageSize: 200 }),
    ]);
    setItems(inv);
    setRetailProducts(prods.items.filter((p) => p.inventoryMode !== 'RecipeBased'));
    setLoading(false);
  };

  useEffect(() => { loadInventory(); }, [storeId, lowStockOnly]);

  const handleAdjust = async () => {
    if (!adjustForm.productId || !adjustForm.quantityChange) {
      toast.error('Select a product and enter a quantity change');
      return;
    }
    try {
      await api.adjustInventory(storeId, {
        productId: adjustForm.productId,
        quantityChange: Number(adjustForm.quantityChange),
        reason: adjustForm.reason,
      });
      toast.success('Inventory adjusted');
      setAdjustOpen(false);
      setAdjustForm({ productId: '', quantityChange: '', reason: '' });
      loadInventory();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to adjust inventory');
    }
  };

  const lowCount = items.filter((i) => i.isLowStock).length;
  const totalQty = items.reduce((sum, i) => sum + i.quantityOnHand, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Track retail product stock per branch"
        action={<Button onClick={() => setAdjustOpen(true)} disabled={!storeId}><PlusIcon data-icon="inline-start" />Adjust Stock</Button>}
      />

      <CatalogWorkflowBanner active="inventory" />

      <Alert>
        <AlertDescription className="text-sm">
          This page tracks <strong>retail products</strong> (finished goods). Recipe-based menu items deduct ingredients from{' '}
          <Link to="/supplies" className="font-medium underline">Supplies</Link> instead — create those on the{' '}
          <Link to="/products" className="font-medium underline">Products</Link> page first.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-end gap-4">
        <FormSelect
          label="Branch"
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

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Products tracked</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{items.length}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total units on hand</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalQty.toFixed(0)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Low stock alerts</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${lowCount > 0 ? 'text-destructive' : ''}`}>{lowCount}</CardContent></Card>
        </div>
      )}

      {loading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <p className="font-medium">No retail inventory yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Create retail products on the Products page, then adjust stock here to set initial quantities.
          </p>
          <Button asChild variant="outline">
            <Link to="/products">Go to Products</Link>
          </Button>
        </div>
      ) : (
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
          <p className="text-sm text-muted-foreground">Use positive numbers to add stock, negative to remove (e.g. -5 for shrinkage).</p>
          <div className="flex flex-col gap-4">
            <FormSelect
              label="Retail product"
              value={adjustForm.productId}
              onValueChange={(v) => setAdjustForm({ ...adjustForm, productId: v })}
              options={[
                { value: '', label: 'Select product' },
                ...retailProducts.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
              ]}
            />
            {retailProducts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No retail products found. <Link to="/products" className="underline">Create a retail product</Link> first.
              </p>
            )}
            <div className="flex flex-col gap-2"><Label>Quantity change (+/-)</Label><Input type="number" placeholder="e.g. 50 or -3" value={adjustForm.quantityChange} onChange={(e) => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Reason</Label><Input placeholder="e.g. Initial stock, delivery, count correction" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} /></div>
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
