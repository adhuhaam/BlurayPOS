import { useEffect, useMemo, useState } from 'react';
import {
  CheckIcon,
  CrownIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  StoreIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { api, ApiError, type PlanAdminDto, type UpsertPlanRequest } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const UNLIMITED_THRESHOLD = 100_000;

function formatLimit(value: number): string {
  return value >= UNLIMITED_THRESHOLD ? 'Unlimited' : value.toLocaleString();
}

function formatPrice(yearly: number): string {
  return yearly === 0 ? 'Free' : `MVR ${yearly.toLocaleString()}/yr`;
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const FEATURE_ROWS: { key: keyof Pick<PlanAdminDto, 'hasInventory' | 'hasKitchen' | 'hasDelivery' | 'hasAccounting' | 'hasAdvancedReports' | 'hasApi' | 'hasPurchases' | 'hasOnlineMenu' | 'hasOnlineOrdering' | 'hasCoupons' | 'hasHr'>; label: string }[] = [
  { key: 'hasInventory', label: 'Inventory management' },
  { key: 'hasKitchen', label: 'Kitchen display' },
  { key: 'hasDelivery', label: 'Delivery module' },
  { key: 'hasOnlineMenu', label: 'Online menu (restaurant)' },
  { key: 'hasOnlineOrdering', label: 'Online ordering' },
  { key: 'hasCoupons', label: 'Coupons & promotions' },
  { key: 'hasHr', label: 'HR management' },
  { key: 'hasAccounting', label: 'Accounting & GST' },
  { key: 'hasAdvancedReports', label: 'Advanced reports' },
  { key: 'hasPurchases', label: 'Purchase management' },
  { key: 'hasApi', label: 'API access' },
];

function emptyPlanForm(sortOrder: number): UpsertPlanRequest {
  return {
    name: '',
    slug: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxStores: 1,
    maxUsers: 5,
    maxTerminals: 1,
    maxProducts: 100,
    maxMonthlyOrders: 500,
    hasInventory: true,
    hasKitchen: false,
    hasDelivery: false,
    hasAccounting: false,
    hasAdvancedReports: false,
    hasApi: false,
    hasPurchases: false,
    hasOnlineMenu: false,
    hasOnlineOrdering: false,
    hasCoupons: false,
    hasHr: false,
    sortOrder,
    isActive: true,
  };
}

function planToForm(p: PlanAdminDto): UpsertPlanRequest {
  const { id: _id, subscriberCount: _sc, ...rest } = p;
  return rest;
}

function FeatureToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="size-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function PlanFeatureRow({ included, label }: { included: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {included ? (
        <CheckIcon className="size-4 shrink-0 text-emerald-500" />
      ) : (
        <XIcon className="size-4 shrink-0 text-muted-foreground/50" />
      )}
      <span className={included ? undefined : 'text-muted-foreground'}>{label}</span>
    </li>
  );
}

function PlanCard({
  plan,
  highlighted,
  onEdit,
  onDeactivate,
}: {
  plan: PlanAdminDto;
  highlighted?: boolean;
  onEdit: () => void;
  onDeactivate?: () => void;
}) {
  const isPro = plan.slug === 'pro';

  return (
    <Card
      className={cn(
        'relative flex flex-col overflow-hidden transition-shadow',
        highlighted && 'border-primary shadow-lg shadow-primary/10',
        !plan.isActive && 'opacity-60',
      )}
    >
      {highlighted && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      )}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {isPro ? (
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CrownIcon className="size-5" />
              </div>
            ) : (
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <SparklesIcon className="size-5" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="mt-0.5">{plan.slug}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isPro && <Badge>Recommended</Badge>}
            {!plan.isActive && <Badge variant="outline">Inactive</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div>
          <p className="text-3xl font-bold tracking-tight">{formatPrice(plan.priceYearly)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <StoreIcon className="size-4 text-muted-foreground" />
          <span>
            <strong>{plan.subscriberCount}</strong> store{plan.subscriberCount !== 1 ? 's' : ''} subscribed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: 'Branches', value: formatLimit(plan.maxStores) },
            { label: 'Users', value: formatLimit(plan.maxUsers) },
            { label: 'Products', value: formatLimit(plan.maxProducts) },
            { label: 'Terminals', value: formatLimit(plan.maxTerminals) },
            { label: 'Orders / mo', value: formatLimit(plan.maxMonthlyOrders) },
          ].map((item) => (
            <div key={item.label} className="rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {FEATURE_ROWS.map((row) => (
            <PlanFeatureRow key={row.key} included={plan[row.key]} label={row.label} />
          ))}
        </ul>

        <div className="flex gap-2">
          <Button variant={highlighted ? 'default' : 'outline'} className="flex-1" onClick={onEdit}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          {onDeactivate && plan.subscriberCount === 0 && (
            <Button variant="outline" size="icon" onClick={onDeactivate} title="Deactivate plan">
              <TrashIcon className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlansPage() {
  const [plans, setPlans] = useState<PlanAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [planModal, setPlanModal] = useState<'create' | 'edit' | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<UpsertPlanRequest | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPlatformPlans();
      setPlans(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activePlans = useMemo(() => plans.filter((p) => p.isActive), [plans]);
  const inactivePlans = useMemo(() => plans.filter((p) => !p.isActive), [plans]);
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscriberCount, 0);

  const savePlan = async () => {
    if (!planForm) return;
    try {
      if (planModal === 'create') {
        await api.createPlatformPlan(planForm);
        toast.success('Plan created');
      } else if (editingPlanId) {
        await api.updatePlatformPlan(editingPlanId, planForm);
        toast.success('Plan updated');
      }
      setPlanModal(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save plan');
    }
  };

  const openCreate = () => {
    const nextOrder = plans.length > 0 ? Math.max(...plans.map((p) => p.sortOrder)) + 1 : 1;
    setPlanForm(emptyPlanForm(nextOrder));
    setEditingPlanId(null);
    setPlanModal('create');
  };

  const openEdit = (p: PlanAdminDto) => {
    setPlanForm(planToForm(p));
    setEditingPlanId(p.id);
    setPlanModal('edit');
  };

  const deactivatePlan = async (plan: PlanAdminDto) => {
    if (!confirm(`Deactivate "${plan.name}"? It will no longer be available for new subscriptions.`)) return;
    try {
      await api.deactivatePlatformPlan(plan.id);
      toast.success('Plan deactivated');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate plan');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Subscription Plans"
        description="Create and edit plans — assign modules per tier. Stores receive features from their subscribed plan."
        action={(
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Create plan
          </Button>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <SparklesIcon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activePlans.length}</p>
              <p className="text-sm text-muted-foreground">Active plans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <StoreIcon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSubscribers}</p>
              <p className="text-sm text-muted-foreground">Stores subscribed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <CrownIcon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{plans.find((p) => p.slug === 'pro')?.subscriberCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">On Pro plan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn('grid gap-6', activePlans.length >= 3 ? 'lg:grid-cols-3' : activePlans.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1')}>
        {activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            highlighted={plan.slug === 'pro'}
            onEdit={() => openEdit(plan)}
            onDeactivate={() => deactivatePlan(plan)}
          />
        ))}
      </div>

      {inactivePlans.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-muted-foreground">Inactive plans</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {inactivePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onEdit={() => openEdit(plan)} />
            ))}
          </div>
        </div>
      )}

      {activePlans.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature comparison</CardTitle>
            <CardDescription>Side-by-side limits and modules for all active plans</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${200 + activePlans.length * 120}px` }}>
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Feature</th>
                  {activePlans.map((plan) => (
                    <th key={plan.id} className={cn('pb-3 pr-4 font-medium', plan.slug === 'pro' && 'text-primary')}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { label: 'Yearly price', values: activePlans.map((p) => formatPrice(p.priceYearly)) },
                  { label: 'Branches', values: activePlans.map((p) => formatLimit(p.maxStores)) },
                  { label: 'Users', values: activePlans.map((p) => formatLimit(p.maxUsers)) },
                  { label: 'Products', values: activePlans.map((p) => formatLimit(p.maxProducts)) },
                  { label: 'Monthly orders', values: activePlans.map((p) => formatLimit(p.maxMonthlyOrders)) },
                  ...FEATURE_ROWS.map((row) => ({
                    label: row.label,
                    values: activePlans.map((p) => (p[row.key] ? 'Included' : '—')),
                  })),
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                    {row.values.map((value, i) => (
                      <td key={activePlans[i].id} className={cn('py-3 pr-4', activePlans[i].slug === 'pro' && 'font-medium text-primary')}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={planModal !== null} onOpenChange={() => setPlanModal(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{planModal === 'create' ? 'Create plan' : 'Edit plan'}</DialogTitle>
          </DialogHeader>
          {planForm && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input
                    value={planForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setPlanForm({
                        ...planForm,
                        name,
                        slug: planModal === 'create' ? slugify(name) : planForm.slug,
                      });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Slug</Label>
                  <Input
                    value={planForm.slug}
                    readOnly={planModal === 'edit'}
                    className={planModal === 'edit' ? 'bg-muted' : undefined}
                    onChange={(e) => setPlanForm({ ...planForm, slug: slugify(e.target.value) })}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label>Description</Label>
                  <Input value={planForm.description ?? ''} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Yearly price (MVR)</Label>
                  <Input type="number" value={planForm.priceYearly} onChange={(e) => setPlanForm({ ...planForm, priceYearly: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Sort order</Label>
                  <Input type="number" value={planForm.sortOrder} onChange={(e) => setPlanForm({ ...planForm, sortOrder: Number(e.target.value) })} />
                </div>
              </div>
              <Separator />
              <p className="text-sm font-medium">Limits</p>
              <p className="text-xs text-muted-foreground">Use 100000 or higher for unlimited.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2"><Label>Max branches</Label><Input type="number" value={planForm.maxStores} onChange={(e) => setPlanForm({ ...planForm, maxStores: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-2"><Label>Max users</Label><Input type="number" value={planForm.maxUsers} onChange={(e) => setPlanForm({ ...planForm, maxUsers: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-2"><Label>Max terminals</Label><Input type="number" value={planForm.maxTerminals} onChange={(e) => setPlanForm({ ...planForm, maxTerminals: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-2"><Label>Max products</Label><Input type="number" value={planForm.maxProducts} onChange={(e) => setPlanForm({ ...planForm, maxProducts: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-2"><Label>Max monthly orders</Label><Input type="number" value={planForm.maxMonthlyOrders} onChange={(e) => setPlanForm({ ...planForm, maxMonthlyOrders: Number(e.target.value) })} /></div>
              </div>
              <Separator />
              <p className="text-sm font-medium">Modules</p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-3">
                <FeatureToggle label="Inventory" checked={planForm.hasInventory} onChange={(v) => setPlanForm({ ...planForm, hasInventory: v })} />
                <FeatureToggle label="Kitchen" checked={planForm.hasKitchen} onChange={(v) => setPlanForm({ ...planForm, hasKitchen: v })} />
                <FeatureToggle label="Delivery" checked={planForm.hasDelivery} onChange={(v) => setPlanForm({ ...planForm, hasDelivery: v })} />
                <FeatureToggle label="Online menu" checked={planForm.hasOnlineMenu} onChange={(v) => setPlanForm({ ...planForm, hasOnlineMenu: v })} />
                <FeatureToggle label="Online ordering" checked={planForm.hasOnlineOrdering} onChange={(v) => setPlanForm({ ...planForm, hasOnlineOrdering: v })} />
                <FeatureToggle label="Coupons" checked={planForm.hasCoupons} onChange={(v) => setPlanForm({ ...planForm, hasCoupons: v })} />
                <FeatureToggle label="HR management" checked={planForm.hasHr} onChange={(v) => setPlanForm({ ...planForm, hasHr: v })} />
                <FeatureToggle label="Accounting" checked={planForm.hasAccounting} onChange={(v) => setPlanForm({ ...planForm, hasAccounting: v })} />
                <FeatureToggle label="Advanced reports" checked={planForm.hasAdvancedReports} onChange={(v) => setPlanForm({ ...planForm, hasAdvancedReports: v })} />
                <FeatureToggle label="API access" checked={planForm.hasApi} onChange={(v) => setPlanForm({ ...planForm, hasApi: v })} />
                <FeatureToggle label="Purchases" checked={planForm.hasPurchases} onChange={(v) => setPlanForm({ ...planForm, hasPurchases: v })} />
                <FeatureToggle label="Active" checked={planForm.isActive} onChange={(v) => setPlanForm({ ...planForm, isActive: v })} />
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanModal(null)}>Cancel</Button>
            <Button onClick={savePlan}>{planModal === 'create' ? 'Create plan' : 'Save changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
