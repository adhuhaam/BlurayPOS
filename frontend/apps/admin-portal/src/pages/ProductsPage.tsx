import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, ChefHatIcon, CheckIcon, ArrowRightIcon } from 'lucide-react';
import { api, ApiError, type ProductDto, type CategoryDto, type ProductRecipeDto, type SupplyItemDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { CategoryPicker } from '@/components/category-picker';
import { CatalogWorkflowBanner } from '@/components/catalog-workflow-banner';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

type WizardStep = 'details' | 'recipe';

const emptyForm = {
  name: '',
  sku: '',
  barcode: '',
  basePrice: '',
  taxRate: '0',
  categoryId: '',
  trackInventory: true,
  inventoryMode: 'FinishedGood',
};

export function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('details');
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [recipeProduct, setRecipeProduct] = useState<ProductDto | null>(null);
  const [recipeLines, setRecipeLines] = useState<ProductRecipeDto[]>([]);
  const [supplyItems, setSupplyItems] = useState<SupplyItemDto[]>([]);
  const [recipeForm, setRecipeForm] = useState({ supplyItemId: '', quantity: '' });
  const [addingSupply, setAddingSupply] = useState(false);
  const [newSupply, setNewSupply] = useState({ name: '', unit: 'piece' });

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

  const loadSupplies = async () => {
    const stores = await api.getStores();
    if (stores[0]) setSupplyItems(await api.getSupplyItems(stores[0].id));
  };

  const loadRecipe = async (product: ProductDto) => {
    setRecipeProduct(product);
    const lines = await api.getProductRecipe(product.id);
    setRecipeLines(lines);
    await loadSupplies();
    setRecipeForm({ supplyItemId: '', quantity: '' });
  };

  const resetModal = () => {
    setModalOpen(false);
    setWizardStep('details');
    setEditing(null);
    setForm(emptyForm);
    setRecipeProduct(null);
    setRecipeLines([]);
    setAddingSupply(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setWizardStep('details');
    setRecipeProduct(null);
    setModalOpen(true);
  };

  const openEdit = (p: ProductDto) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode ?? '',
      basePrice: String(p.basePrice),
      taxRate: String(p.taxRate),
      categoryId: p.categoryId ?? '',
      trackInventory: p.trackInventory,
      inventoryMode: p.inventoryMode ?? 'FinishedGood',
    });
    setWizardStep('details');
    setModalOpen(true);
  };

  const openRecipeOnly = async (p: ProductDto) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode ?? '',
      basePrice: String(p.basePrice),
      taxRate: String(p.taxRate),
      categoryId: p.categoryId ?? '',
      trackInventory: p.trackInventory,
      inventoryMode: p.inventoryMode ?? 'RecipeBased',
    });
    setWizardStep('recipe');
    setModalOpen(true);
    await loadRecipe(p);
  };

  const handleSaveDetails = async () => {
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!editing && !form.sku.trim()) {
      toast.error('SKU is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.updateProduct(editing.id, {
          name: form.name,
          barcode: form.barcode || undefined,
          basePrice: Number(form.basePrice),
          taxRate: Number(form.taxRate),
          categoryId: form.categoryId || undefined,
          isActive: editing.isActive,
          trackInventory: form.trackInventory,
          inventoryMode: form.inventoryMode,
        });
        toast.success('Product updated');
        if (form.inventoryMode === 'RecipeBased') {
          const updated = { ...editing, ...form, basePrice: Number(form.basePrice), taxRate: Number(form.taxRate) };
          setEditing(updated as ProductDto);
          setWizardStep('recipe');
          await loadRecipe(updated as ProductDto);
        } else {
          resetModal();
        }
      } else {
        const created = await api.createProduct({
          name: form.name,
          sku: form.sku,
          barcode: form.barcode || undefined,
          basePrice: Number(form.basePrice),
          taxRate: Number(form.taxRate),
          categoryId: form.categoryId || undefined,
          trackInventory: form.trackInventory,
          inventoryMode: form.inventoryMode,
        });
        toast.success('Product created');
        setEditing(created);
        if (form.inventoryMode === 'RecipeBased') {
          setWizardStep('recipe');
          await loadRecipe(created);
        } else {
          resetModal();
        }
      }
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const addRecipeLine = async () => {
    if (!recipeProduct || !recipeForm.supplyItemId || !recipeForm.quantity) return;
    try {
      await api.upsertProductRecipe(recipeProduct.id, {
        supplyItemId: recipeForm.supplyItemId,
        quantity: Number(recipeForm.quantity),
      });
      setRecipeLines(await api.getProductRecipe(recipeProduct.id));
      setRecipeForm({ supplyItemId: '', quantity: '' });
      toast.success('Ingredient added to recipe');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save recipe');
    }
  };

  const removeRecipeLine = async (recipeId: string) => {
    if (!recipeProduct) return;
    await api.deleteProductRecipe(recipeProduct.id, recipeId);
    setRecipeLines(await api.getProductRecipe(recipeProduct.id));
    toast.success('Ingredient removed');
  };

  const createSupplyInline = async () => {
    if (!newSupply.name.trim()) return;
    const stores = await api.getStores();
    if (!stores[0]) {
      toast.error('No store found — create a branch first');
      return;
    }
    try {
      const item = await api.createSupplyItem({
        name: newSupply.name.trim(),
        unit: newSupply.unit,
        costPerUnit: 0,
        lowStockThreshold: 0,
        storeId: stores[0].id,
      });
      setSupplyItems((prev) => [...prev, item]);
      setRecipeForm((f) => ({ ...f, supplyItemId: item.id }));
      setAddingSupply(false);
      setNewSupply({ name: '', unit: 'piece' });
      toast.success(`Ingredient "${item.name}" created`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create ingredient');
    }
  };

  const isRecipeMode = form.inventoryMode === 'RecipeBased';
  const showRecipeStep = wizardStep === 'recipe' && recipeProduct;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description="Build your menu and catalog — create a product, then add its recipe"
        action={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Add Product
          </Button>
        }
      />

      <CatalogWorkflowBanner active="products" />

      <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <PackageIconPlaceholder />
          <div>
            <p className="font-medium">No products yet</p>
            <p className="text-sm text-muted-foreground">Start by adding your first product. Recipe items can have ingredients added right after.</p>
          </div>
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Add your first product
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                  <TableCell>${p.basePrice.toFixed(2)}</TableCell>
                  <TableCell>{p.categoryName ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={p.inventoryMode === 'RecipeBased' ? 'default' : 'secondary'}>
                      {p.inventoryMode === 'RecipeBased' ? 'Recipe' : 'Retail'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.inventoryMode === 'RecipeBased' ? (
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => openRecipeOnly(p)}>
                        <ChefHatIcon className="size-3.5" />
                        Manage recipe
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} title="Edit">
                        <PencilIcon />
                      </Button>
                      {p.inventoryMode === 'RecipeBased' && (
                        <Button variant="ghost" size="icon-sm" onClick={() => openRecipeOnly(p)} title="Recipe">
                          <ChefHatIcon />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(o) => !o && resetModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {showRecipeStep
                ? `Recipe — ${recipeProduct?.name}`
                : editing
                  ? 'Edit Product'
                  : 'New Product'}
            </DialogTitle>
          </DialogHeader>

          {isRecipeMode && (
            <WizardSteps current={wizardStep} />
          )}

          {wizardStep === 'details' ? (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input
                    autoFocus
                    placeholder="e.g. Chicken Burger"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                {!editing && (
                  <div className="flex flex-col gap-2">
                    <Label>SKU</Label>
                    <Input
                      placeholder="e.g. BURGER-001"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label>Barcode <span className="text-muted-foreground">(optional)</span></Label>
                  <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Price</Label>
                    <Input type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Tax Rate</Label>
                    <Input type="number" step="0.01" min="0" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
                  </div>
                </div>
                <FormSelect
                  label="Product type"
                  value={form.inventoryMode}
                  onValueChange={(v) => setForm({ ...form, inventoryMode: v })}
                  options={[
                    { value: 'FinishedGood', label: 'Retail — track finished stock in Inventory' },
                    { value: 'RecipeBased', label: 'Recipe — deduct ingredients when sold' },
                  ]}
                />
                {form.inventoryMode === 'RecipeBased' && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      After saving, you'll add ingredients on the next step. Make sure ingredients exist in{' '}
                      <Link to="/supplies" className="font-medium underline">Supplies</Link> first.
                    </AlertDescription>
                  </Alert>
                )}
                <CategoryPicker
                  categories={categories}
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  onCategoriesChange={setCategories}
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={resetModal}>Cancel</Button>
                {editing && isRecipeMode && (
                  <Button variant="secondary" onClick={async () => { setWizardStep('recipe'); await loadRecipe(editing); }}>
                    Edit recipe
                  </Button>
                )}
                <Button onClick={handleSaveDetails} disabled={saving}>
                  {isRecipeMode ? (
                    <>
                      {editing ? 'Save & edit recipe' : 'Save & add recipe'}
                      <ArrowRightIcon data-icon="inline-end" />
                    </>
                  ) : (
                    'Save product'
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : showRecipeStep ? (
            <>
              <p className="text-sm text-muted-foreground">
                Add ingredients and quantities used per 1 unit sold. Stock deducts automatically when the order is paid.
              </p>
              {recipeLines.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No ingredients yet — add your first one below.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Qty per portion</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipeLines.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.supplyItemName}</TableCell>
                          <TableCell>{r.quantity} {r.unit}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeRecipeLine(r.id)}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {supplyItems.length === 0 && !addingSupply ? (
                <Alert>
                  <AlertDescription className="text-sm">
                    No ingredients found.{' '}
                    <Button variant="link" className="h-auto p-0" onClick={() => setAddingSupply(true)}>
                      Add one now
                    </Button>{' '}
                    or go to <Link to="/supplies" className="font-medium underline">Supplies</Link>.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-medium">Add ingredient</p>
                  {addingSupply ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        autoFocus
                        placeholder="Ingredient name"
                        value={newSupply.name}
                        onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <FormSelect
                          label=""
                          value={newSupply.unit}
                          onValueChange={(v) => setNewSupply({ ...newSupply, unit: v })}
                          options={['piece', 'kg', 'g', 'litre', 'ml', 'bottle', 'pack'].map((u) => ({ value: u, label: u }))}
                        />
                        <Button onClick={createSupplyInline} disabled={!newSupply.name.trim()}>Create</Button>
                        <Button variant="ghost" onClick={() => setAddingSupply(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect
                        label="Ingredient"
                        value={recipeForm.supplyItemId}
                        onValueChange={(v) => {
                          if (v === '__create_supply__') setAddingSupply(true);
                          else setRecipeForm({ ...recipeForm, supplyItemId: v });
                        }}
                        options={[
                          ...supplyItems.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` })),
                          { value: '__create_supply__', label: '+ Add new ingredient…' },
                        ]}
                        placeholder="Select ingredient"
                      />
                      <div className="flex flex-col gap-2">
                        <Label>Qty per portion</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          placeholder="e.g. 0.15"
                          value={recipeForm.quantity}
                          onChange={(e) => setRecipeForm({ ...recipeForm, quantity: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  {!addingSupply && (
                    <Button
                      size="sm"
                      className="self-start"
                      onClick={addRecipeLine}
                      disabled={!recipeForm.supplyItemId || !recipeForm.quantity}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Add to recipe
                    </Button>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setWizardStep('details')}>Back to details</Button>
                <Button onClick={resetModal}>
                  <CheckIcon data-icon="inline-start" />
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WizardSteps({ current }: { current: WizardStep }) {
  const steps = [
    { key: 'details' as const, label: '1. Product details' },
    { key: 'recipe' as const, label: '2. Recipe' },
  ];
  return (
    <div className="flex gap-2">
      {steps.map((s) => (
        <div
          key={s.key}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            current === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}

function PackageIconPlaceholder() {
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
      <PlusIcon className="size-6 text-muted-foreground" />
    </div>
  );
}
