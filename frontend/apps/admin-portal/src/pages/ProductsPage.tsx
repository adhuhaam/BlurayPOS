import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, ChefHatIcon } from 'lucide-react';
import { api, type ProductDto, type CategoryDto, type ProductRecipeDto, type SupplyItemDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', basePrice: '', taxRate: '0', categoryId: '', trackInventory: true, inventoryMode: 'FinishedGood',
  });
  const [recipeProduct, setRecipeProduct] = useState<ProductDto | null>(null);
  const [recipeLines, setRecipeLines] = useState<ProductRecipeDto[]>([]);
  const [supplyItems, setSupplyItems] = useState<SupplyItemDto[]>([]);
  const [recipeForm, setRecipeForm] = useState({ supplyItemId: '', quantity: '' });

  const load = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([
      api.getProducts({ search: search || undefined, pageSize: 100 }),
      api.getCategories(),
    ]);
    setProducts(prods.items);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sku: '', barcode: '', basePrice: '', taxRate: '0', categoryId: '', trackInventory: true, inventoryMode: 'FinishedGood' });
    setModalOpen(true);
  };

  const openEdit = (p: ProductDto) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode ?? '', basePrice: String(p.basePrice),
      taxRate: String(p.taxRate), categoryId: p.categoryId ?? '', trackInventory: p.trackInventory, inventoryMode: p.inventoryMode ?? 'FinishedGood',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.updateProduct(editing.id, {
          name: form.name, barcode: form.barcode || undefined, basePrice: Number(form.basePrice),
          taxRate: Number(form.taxRate), categoryId: form.categoryId || undefined,
          isActive: editing.isActive, trackInventory: form.trackInventory, inventoryMode: form.inventoryMode,
        });
        toast.success('Product updated');
      } else {
        await api.createProduct({
          name: form.name, sku: form.sku, barcode: form.barcode || undefined,
          basePrice: Number(form.basePrice), taxRate: Number(form.taxRate),
          categoryId: form.categoryId || undefined, trackInventory: form.trackInventory, inventoryMode: form.inventoryMode,
        });
        toast.success('Product created');
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error('Failed to save product');
    }
  };

  const openRecipe = async (p: ProductDto) => {
    setRecipeProduct(p);
    const [lines, stores] = await Promise.all([api.getProductRecipe(p.id), api.getStores()]);
    setRecipeLines(lines);
    if (stores[0]) setSupplyItems(await api.getSupplyItems(stores[0].id));
    setRecipeForm({ supplyItemId: '', quantity: '' });
  };

  const addRecipeLine = async () => {
    if (!recipeProduct || !recipeForm.supplyItemId || !recipeForm.quantity) return;
    try {
      await api.upsertProductRecipe(recipeProduct.id, { supplyItemId: recipeForm.supplyItemId, quantity: Number(recipeForm.quantity) });
      setRecipeLines(await api.getProductRecipe(recipeProduct.id));
      setRecipeForm({ supplyItemId: '', quantity: '' });
      toast.success('Recipe line saved');
    } catch { toast.error('Failed to save recipe'); }
  };

  const removeRecipeLine = async (recipeId: string) => {
    if (!recipeProduct) return;
    await api.deleteProductRecipe(recipeProduct.id, recipeId);
    setRecipeLines(await api.getProductRecipe(recipeProduct.id));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Add Product
          </Button>
        }
      />

      <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell className="text-muted-foreground">{p.barcode ?? '—'}</TableCell>
                  <TableCell>${p.basePrice.toFixed(2)}</TableCell>
                  <TableCell>{p.categoryName ?? '—'}</TableCell>
                  <TableCell>{p.inventoryMode === 'RecipeBased' ? 'Recipe' : 'Retail'}</TableCell>
                  <TableCell className="flex gap-1">
                    {p.inventoryMode === 'RecipeBased' && (
                      <Button variant="ghost" size="icon-sm" onClick={() => openRecipe(p)} title="Recipe"><ChefHatIcon /></Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                      <PencilIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            {!editing && (
              <div className="flex flex-col gap-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Price</Label>
                <Input type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tax Rate</Label>
                <Input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
              </div>
            </div>
            <FormSelect
              label="Inventory Type"
              value={form.inventoryMode}
              onValueChange={(v) => setForm({ ...form, inventoryMode: v })}
              options={[
                { value: 'FinishedGood', label: 'Retail (track finished stock)' },
                { value: 'RecipeBased', label: 'Recipe (deduct ingredients on sale)' },
              ]}
            />
            <FormSelect
              label="Category"
              value={form.categoryId}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
              options={[{ value: '', label: 'None' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recipeProduct} onOpenChange={(o) => !o && setRecipeProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Recipe — {recipeProduct?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Quantities per 1 unit sold. Stock deducts ingredients when order is paid.</p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Qty</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {recipeLines.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.supplyItemName}</TableCell>
                    <TableCell>{r.quantity} {r.unit}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => removeRecipeLine(r.id)}>Remove</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Ingredient" value={recipeForm.supplyItemId} onValueChange={(v) => setRecipeForm({ ...recipeForm, supplyItemId: v })} options={supplyItems.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))} />
            <div className="flex flex-col gap-2"><Label>Qty per portion</Label><Input type="number" step="0.0001" value={recipeForm.quantity} onChange={(e) => setRecipeForm({ ...recipeForm, quantity: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={addRecipeLine}>Add Line</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
