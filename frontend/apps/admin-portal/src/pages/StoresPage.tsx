import { useEffect, useState } from 'react';
import { PlusIcon, MapPinIcon, PencilIcon, UserIcon } from 'lucide-react';
import { api, type StoreDto } from '@pos/api-client';
import { useAuth } from '@/auth';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const emptyForm = {
  name: '', code: '', address: '', phone: '',
  adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
  createAdmin: true,
};

export function StoresPage() {
  const { canManageStores, subscription } = useAuth();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '', isActive: true });

  const load = async () => {
    setLoading(true);
    setStores(await api.getStores());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const result = await api.createStore({
        name: form.name, code: form.code,
        address: form.address || undefined, phone: form.phone || undefined,
        admin: form.createAdmin ? {
          email: form.adminEmail,
          password: form.adminPassword,
          firstName: form.adminFirstName,
          lastName: form.adminLastName,
        } : undefined,
      });
      toast.success(result.storeAdmin
        ? `Store created with admin ${result.storeAdmin.email}`
        : 'Store created');
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error('Failed to create store');
    }
  };

  const handleUpdate = async () => {
    if (!editStore) return;
    try {
      await api.updateStore(editStore.id, {
        name: editForm.name,
        address: editForm.address || undefined,
        phone: editForm.phone || undefined,
        isActive: editForm.isActive,
      });
      toast.success('Store updated');
      setEditStore(null);
      load();
    } catch {
      toast.error('Failed to update store');
    }
  };

  const openEdit = (store: StoreDto) => {
    setEditStore(store);
    setEditForm({ name: store.name, address: store.address ?? '', phone: store.phone ?? '', isActive: store.isActive });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stores"
        description={subscription ? `${subscription.storeCount} of ${subscription.maxStores} stores used` : 'Manage store locations'}
        action={canManageStores ? <Button onClick={() => setModalOpen(true)}><PlusIcon data-icon="inline-start" />Add Store</Button> : undefined}
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{s.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={s.isActive ? 'secondary' : 'outline'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                    {canManageStores && (
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)}><PencilIcon /></Button>
                    )}
                  </div>
                </div>
                <CardDescription>Code: {s.code}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {s.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                    <span>{s.address}</span>
                  </div>
                )}
                {s.phone && <p className="text-sm text-muted-foreground">{s.phone}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Store</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div className="flex flex-col gap-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium"><UserIcon className="size-4" />Store Admin (Store Manager)</div>
            <div className="flex flex-col gap-2"><Label>Email</Label><Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Password</Label><Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>First Name</Label><Input value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Last Name</Label><Input value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Store</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editStore} onOpenChange={(open) => !open && setEditStore(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Store</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Address</Label><Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
