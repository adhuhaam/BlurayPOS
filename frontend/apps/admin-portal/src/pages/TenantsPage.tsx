import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, Building2Icon, BanIcon, CheckCircleIcon, PencilIcon, UsersIcon } from 'lucide-react';
import {
  api,
  ApiError,
  type OrganizationDetailDto,
  type OrganizationListItemDto,
  type PlanAdminDto,
  type UpdatePlatformOrganizationRequest,
} from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormSelect } from '@/components/form-select';
import { toast } from 'sonner';

type EditForm = UpdatePlatformOrganizationRequest & {
  planId: string;
  managerPassword: string;
};

const emptyEditForm = (): EditForm => ({
  name: '',
  businessEmail: '',
  phone: '',
  address: '',
  timezone: 'Indian/Maldives',
  currency: 'MVR',
  defaultTaxRate: 0.08,
  receiptHeader: '',
  receiptFooter: '',
  paymentQrPayload: '',
  paymentInstructions: '',
  isReadOnly: false,
  planId: '',
  managerPassword: '',
});

function detailToForm(detail: OrganizationDetailDto): EditForm {
  return {
    name: detail.name,
    businessEmail: detail.businessEmail ?? '',
    phone: detail.phone ?? '',
    address: detail.address ?? '',
    timezone: detail.timezone,
    currency: detail.currency,
    defaultTaxRate: detail.defaultTaxRate,
    receiptHeader: detail.receiptHeader ?? '',
    receiptFooter: detail.receiptFooter ?? '',
    paymentQrPayload: detail.paymentQrPayload ?? '',
    paymentInstructions: detail.paymentInstructions ?? '',
    isReadOnly: detail.isReadOnly,
    planId: detail.planId ?? '',
    managerPassword: '',
  };
}

export function TenantsPage() {
  const [stores, setStores] = useState<OrganizationListItemDto[]>([]);
  const [plans, setPlans] = useState<PlanAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<OrganizationDetailDto | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm());
  const [createForm, setCreateForm] = useState({
    name: '', slug: '', planId: '',
    adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [storeList, planList] = await Promise.all([
        api.getOrganizations(),
        api.getPlatformPlans(),
      ]);
      setStores(storeList);
      setPlans(planList.filter((p) => p.isActive));
      if (!createForm.planId && planList.length > 0) {
        const free = planList.find((p) => p.slug === 'free') ?? planList[0];
        setCreateForm((f) => ({ ...f, planId: free.id }));
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = async (store: OrganizationListItemDto) => {
    setEditLoading(true);
    setEditingStore({ id: store.id } as OrganizationDetailDto);
    try {
      const detail = await api.getPlatformOrganization(store.id);
      setEditingStore(detail);
      setEditForm(detailToForm(detail));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load store details');
      setEditingStore(null);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createOrganization({
        name: createForm.name,
        slug: createForm.slug,
        planId: createForm.planId,
        adminEmail: createForm.adminEmail,
        adminPassword: createForm.adminPassword,
        adminFirstName: createForm.adminFirstName,
        adminLastName: createForm.adminLastName,
      });
      toast.success(`Store "${createForm.name}" created`);
      setCreateModalOpen(false);
      setCreateForm({
        name: '', slug: '', planId: plans.find((p) => p.slug === 'free')?.id ?? plans[0]?.id ?? '',
        adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create store');
    }
  };

  const saveEdit = async () => {
    if (!editingStore) return;
    try {
      const { planId, managerPassword, ...updateData } = editForm;

      if (planId && planId !== editingStore.planId) {
        await api.changeOrganizationPlan(editingStore.id, planId);
      }

      if (managerPassword.trim()) {
        await api.resetManagerPassword(editingStore.id, managerPassword.trim());
      }

      await api.updatePlatformOrganization(editingStore.id, {
        ...updateData,
        businessEmail: updateData.businessEmail || undefined,
        phone: updateData.phone || undefined,
        address: updateData.address || undefined,
        receiptHeader: updateData.receiptHeader || undefined,
        receiptFooter: updateData.receiptFooter || undefined,
        paymentQrPayload: updateData.paymentQrPayload || undefined,
        paymentInstructions: updateData.paymentInstructions || undefined,
      });

      toast.success(`Store "${editForm.name}" updated`);
      setEditingStore(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update store');
    }
  };

  const toggleSuspend = async (store: OrganizationListItemDto) => {
    try {
      await api.suspendOrganization(store.id, !store.isSuspended);
      toast.success(store.isSuspended ? `${store.name} activated` : `${store.name} suspended`);
      load();
      if (editingStore?.id === store.id) {
        const detail = await api.getPlatformOrganization(store.id);
        setEditingStore(detail);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update store status');
    }
  };

  const changePlan = async (storeId: string, planId: string) => {
    try {
      await api.changeOrganizationPlan(storeId, planId);
      toast.success('Plan updated');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to change plan');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stores"
        description="Tenant businesses on the platform — provision, edit, suspend, and assign plans"
        action={<Button onClick={() => setCreateModalOpen(true)}><PlusIcon data-icon="inline-start" />New Store</Button>}
      />

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No stores yet
                  </TableCell>
                </TableRow>
              ) : stores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2Icon className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <FormSelect
                      value={s.planId ?? ''}
                      onValueChange={(planId) => changePlan(s.id, planId)}
                      options={plans.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </TableCell>
                  <TableCell>
                    {s.currentPeriodEnd ? (
                      <div className="text-sm">
                        <div>{new Date(s.currentPeriodEnd).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.daysRemaining != null ? `${s.daysRemaining}d left` : '—'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">{s.subscriptionStatus}</Badge>
                      {s.subscriptionStatus === 'PastDue' && <Badge variant="destructive">Past due</Badge>}
                      {s.isSuspended && <Badge variant="destructive">Suspended</Badge>}
                      {s.isReadOnly && <Badge variant="outline">Read-only</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{s.storeCount}</TableCell>
                  <TableCell>{s.userCount}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                        <PencilIcon data-icon="inline-start" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleSuspend(s)}>
                        {s.isSuspended ? (
                          <><CheckCircleIcon data-icon="inline-start" />Activate</>
                        ) : (
                          <><BanIcon data-icon="inline-start" />Suspend</>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create store */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Provision New Store</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Business name</Label><Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Slug</Label><Input value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
            </div>
            <FormSelect label="Plan" value={createForm.planId} onValueChange={(v) => setCreateForm({ ...createForm, planId: v })} options={plans.map((p) => ({ value: p.id, label: `${p.name} — ${p.priceYearly === 0 ? 'Free' : `MVR ${p.priceYearly.toLocaleString()}/yr`}` }))} />
            <div className="flex flex-col gap-2"><Label>Manager email</Label><Input type="email" value={createForm.adminEmail} onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Manager password</Label><Input type="password" value={createForm.adminPassword} onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>First name</Label><Input value={createForm.adminFirstName} onChange={(e) => setCreateForm({ ...createForm, adminFirstName: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Last name</Label><Input value={createForm.adminLastName} onChange={(e) => setCreateForm({ ...createForm, adminLastName: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Store</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit store */}
      <Dialog open={editingStore !== null} onOpenChange={() => setEditingStore(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit store</DialogTitle>
          </DialogHeader>
          {editLoading ? (
            <Skeleton className="h-64" />
          ) : editingStore && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">{editingStore.slug}</span>
                <Badge variant="secondary">{editingStore.planName}</Badge>
                <Badge variant="outline">{editingStore.subscriptionStatus}</Badge>
                {editingStore.isSuspended && <Badge variant="destructive">Suspended</Badge>}
                {editingStore.isReadOnly && <Badge variant="outline">Read-only</Badge>}
                <span className="text-muted-foreground">
                  · {editingStore.storeCount} branches · {editingStore.userCount} users
                </span>
                <Button variant="link" size="sm" className="ml-auto h-auto p-0" render={<Link to={`/platform-users?store=${editingStore.id}`} />}>
                  <UsersIcon data-icon="inline-start" />
                  View users
                </Button>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Business details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="col-span-2 flex flex-col gap-2">
                    <Label>Business name</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Business email</Label>
                    <Input type="email" value={editForm.businessEmail} onChange={(e) => setEditForm({ ...editForm, businessEmail: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Phone</Label>
                    <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-2">
                    <Label>Address</Label>
                    <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Timezone</Label>
                    <Input value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Currency</Label>
                    <Input value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Default tax rate</Label>
                    <Input type="number" step="0.01" value={editForm.defaultTaxRate} onChange={(e) => setEditForm({ ...editForm, defaultTaxRate: Number(e.target.value) })} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-medium">Subscription</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormSelect
                    label="Plan"
                    value={editForm.planId}
                    onValueChange={(v) => setEditForm({ ...editForm, planId: v })}
                    options={plans.map((p) => ({ value: p.id, label: `${p.name} — ${p.priceYearly === 0 ? 'Free' : `MVR ${p.priceYearly.toLocaleString()}/yr`}` }))}
                  />
                  {editingStore.currentPeriodEnd && (
                    <div className="flex flex-col gap-2">
                      <Label>Renews</Label>
                      <Input readOnly className="bg-muted" value={new Date(editingStore.currentPeriodEnd).toLocaleDateString()} />
                    </div>
                  )}
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={editForm.isReadOnly}
                    onChange={(e) => setEditForm({ ...editForm, isReadOnly: e.target.checked })}
                  />
                  Read-only mode (subscription expired)
                </label>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-medium">Receipt & payments</p>
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Receipt header</Label>
                    <Input value={editForm.receiptHeader} onChange={(e) => setEditForm({ ...editForm, receiptHeader: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Receipt footer</Label>
                    <Input value={editForm.receiptFooter} onChange={(e) => setEditForm({ ...editForm, receiptFooter: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Payment QR payload</Label>
                    <Input value={editForm.paymentQrPayload} onChange={(e) => setEditForm({ ...editForm, paymentQrPayload: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Payment instructions</Label>
                    <Input value={editForm.paymentInstructions} onChange={(e) => setEditForm({ ...editForm, paymentInstructions: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-medium">Manager account</p>
                <div className="flex flex-col gap-2">
                  <Label>Reset manager password (optional)</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={editForm.managerPassword}
                    onChange={(e) => setEditForm({ ...editForm, managerPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {editingStore && (
              <Button
                variant="outline"
                className="mr-auto"
                onClick={() => toggleSuspend({
                  id: editingStore.id,
                  name: editingStore.name,
                  slug: editingStore.slug,
                  planId: editingStore.planId,
                  planName: editingStore.planName,
                  subscriptionStatus: editingStore.subscriptionStatus,
                  isSuspended: editingStore.isSuspended,
                  isReadOnly: editingStore.isReadOnly,
                  storeCount: editingStore.storeCount,
                  userCount: editingStore.userCount,
                  createdAt: editingStore.createdAt,
                })}
              >
                {editingStore.isSuspended ? 'Activate store' : 'Suspend store'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditingStore(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={editLoading}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
