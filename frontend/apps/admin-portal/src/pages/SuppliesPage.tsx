import { useEffect, useState } from 'react';
import { PlusIcon, PackageIcon, TrendingUpIcon, ClipboardListIcon, AlertTriangleIcon } from 'lucide-react';
import { api, type SupplyItemDto, type SupplyLogDto, type StoreDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const UNITS = ['piece', 'kg', 'g', 'litre', 'ml', 'carton', 'box', 'bottle', 'bag', 'pack', 'dozen'];
type Tab = 'stock' | 'supply' | 'logs';

export function SuppliesPage() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [items, setItems] = useState<SupplyItemDto[]>([]);
  const [logs, setLogs] = useState<SupplyLogDto[]>([]);
  const [tab, setTab] = useState<Tab>('stock');
  const [loading, setLoading] = useState(true);
  const [itemDialog, setItemDialog] = useState(false);
  const [editItem, setEditItem] = useState<SupplyItemDto | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', unit: 'piece', category: '', costPerUnit: '0', lowStockThreshold: '0' });
  const [supplyForm, setSupplyForm] = useState({ supplyItemId: '', quantity: '', costPerUnit: '', note: '' });

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    const [supplyItems, supplyLogs] = await Promise.all([
      api.getSupplyItems(storeId),
      tab === 'logs' ? api.getSupplyLogs(storeId) : Promise.resolve([] as SupplyLogDto[]),
    ]);
    setItems(supplyItems);
    setLogs(supplyLogs);
    setLoading(false);
  };

  useEffect(() => {
    api.getStores().then((s) => { setStores(s); if (s[0]) setStoreId(s[0].id); });
  }, []);

  useEffect(() => { load(); }, [storeId, tab]);

  const lowStock = items.filter((i) => i.isLowStock);
  const stockValue = items.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);

  const saveItem = async () => {
    try {
      if (editItem) {
        await api.updateSupplyItem(editItem.id, storeId, {
          name: itemForm.name, unit: itemForm.unit, category: itemForm.category || undefined,
          costPerUnit: Number(itemForm.costPerUnit), lowStockThreshold: Number(itemForm.lowStockThreshold),
        });
        toast.success('Supply item updated');
      } else {
        await api.createSupplyItem({
          name: itemForm.name, unit: itemForm.unit, category: itemForm.category || undefined,
          costPerUnit: Number(itemForm.costPerUnit), lowStockThreshold: Number(itemForm.lowStockThreshold), storeId,
        });
        toast.success('Supply item created');
      }
      setItemDialog(false);
      load();
    } catch { toast.error('Failed to save supply item'); }
  };

  const recordSupply = async () => {
    try {
      await api.recordSupply({
        storeId, supplyItemId: supplyForm.supplyItemId, quantity: Number(supplyForm.quantity),
        costPerUnit: supplyForm.costPerUnit ? Number(supplyForm.costPerUnit) : undefined,
        note: supplyForm.note || undefined,
      });
      toast.success('Supply recorded');
      setSupplyForm({ supplyItemId: '', quantity: '', costPerUnit: '', note: '' });
      load();
    } catch { toast.error('Failed to record supply'); }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Supplies & Ingredients" description="Ingredient stock, supply receiving, and usage logs" />
      <div className="flex flex-wrap items-center gap-4">
        <FormSelect label="Store" value={storeId} onValueChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} className="min-w-48" />
        <div className="flex gap-2">
          {(['stock', 'supply', 'logs'] as Tab[]).map((t) => (
            <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)}>
              {t === 'stock' && <PackageIcon data-icon="inline-start" />}
              {t === 'supply' && <TrendingUpIcon data-icon="inline-start" />}
              {t === 'logs' && <ClipboardListIcon data-icon="inline-start" />}
              {t === 'stock' ? 'Stock' : t === 'supply' ? 'Receive' : 'Logs'}
            </Button>
          ))}
        </div>
        {tab === 'stock' && <Button className="ml-auto" onClick={() => { setEditItem(null); setItemForm({ name: '', unit: 'piece', category: '', costPerUnit: '0', lowStockThreshold: '0' }); setItemDialog(true); }}><PlusIcon data-icon="inline-start" />Add Ingredient</Button>}
      </div>

      {tab === 'stock' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Items</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{items.length}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Stock Value</CardTitle></CardHeader><CardContent className="text-2xl font-bold">${stockValue.toFixed(2)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Low Stock</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-destructive">{lowStock.length}</CardContent></Card>
          </div>
          {loading ? <Skeleton className="h-64" /> : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead><TableHead>Cost/Unit</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>{i.category ?? '—'}</TableCell>
                      <TableCell>{i.currentStock.toFixed(2)} {i.unit}</TableCell>
                      <TableCell>${i.costPerUnit.toFixed(2)}</TableCell>
                      <TableCell>{i.isLowStock ? <Badge variant="destructive"><AlertTriangleIcon className="size-3" /> Low</Badge> : <Badge variant="secondary">OK</Badge>}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => { setEditItem(i); setItemForm({ name: i.name, unit: i.unit, category: i.category ?? '', costPerUnit: String(i.costPerUnit), lowStockThreshold: String(i.lowStockThreshold) }); setItemDialog(true); }}>Edit</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {tab === 'supply' && (
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Record Supply Delivery</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormSelect label="Ingredient" value={supplyForm.supplyItemId} onValueChange={(v) => setSupplyForm({ ...supplyForm, supplyItemId: v })} options={items.map((i) => ({ value: i.id, label: `${i.name} (${i.currentStock} ${i.unit})` }))} />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Quantity</Label><Input type="number" step="0.0001" value={supplyForm.quantity} onChange={(e) => setSupplyForm({ ...supplyForm, quantity: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Cost/Unit (optional)</Label><Input type="number" step="0.01" value={supplyForm.costPerUnit} onChange={(e) => setSupplyForm({ ...supplyForm, costPerUnit: e.target.value })} /></div>
            </div>
            <div className="flex flex-col gap-2"><Label>Note</Label><Input value={supplyForm.note} onChange={(e) => setSupplyForm({ ...supplyForm, note: e.target.value })} /></div>
            <Button onClick={recordSupply}>Record Supply</Button>
          </CardContent>
        </Card>
      )}

      {tab === 'logs' && (loading ? <Skeleton className="h-64" /> : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{new Date(l.suppliedAt).toLocaleString()}</TableCell>
                  <TableCell>{l.supplyItemName}</TableCell>
                  <TableCell>{l.quantity} {l.unit}</TableCell>
                  <TableCell>{l.totalCost != null ? `$${l.totalCost.toFixed(2)}` : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{l.note ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit Ingredient' : 'New Ingredient'}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Name</Label><Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></div>
            <FormSelect label="Unit" value={itemForm.unit} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })} options={UNITS.map((u) => ({ value: u, label: u }))} />
            <div className="flex flex-col gap-2"><Label>Category</Label><Input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="e.g. Dairy, Produce" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Cost/Unit</Label><Input type="number" step="0.01" value={itemForm.costPerUnit} onChange={(e) => setItemForm({ ...itemForm, costPerUnit: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Low Stock Alert</Label><Input type="number" step="0.0001" value={itemForm.lowStockThreshold} onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setItemDialog(false)}>Cancel</Button><Button onClick={saveItem}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
