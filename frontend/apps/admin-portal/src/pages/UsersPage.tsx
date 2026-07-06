import { useEffect, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { api, type UserListItemDto, type StoreDto } from '@pos/api-client';
import { useAuth } from '@/auth';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function UsersPage() {
  const { roles, isSuperAdmin } = useAuth();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'Cashier', defaultStoreId: '',
  });

  const canCreate = roles.includes('OrgAdmin') || roles.includes('SuperAdmin');

  const load = async () => {
    const [userList, storeList] = await Promise.all([api.getUsers(), api.getStores()]);
    setUsers(userList);
    setStores(storeList);
  };

  useEffect(() => {
    if (canCreate) load();
  }, [canCreate]);

  const handleCreate = async () => {
    try {
      await api.createUser({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        role: form.role, defaultStoreId: form.defaultStoreId || undefined,
      });
      toast.success(`User ${form.email} created`);
      setModalOpen(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'Cashier', defaultStoreId: '' });
      load();
    } catch {
      toast.error('Failed to create user');
    }
  };

  if (!canCreate) {
    return (
      <div>
        <PageHeader title="Users" />
        <p className="text-muted-foreground">You need OrgAdmin privileges to manage users.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage staff accounts and roles"
        action={<Button onClick={() => setModalOpen(true)}><PlusIcon data-icon="inline-start" />Create User</Button>}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{u.firstName} {u.lastName}</TableCell>
                <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'secondary' : 'outline'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <FormSelect label="Role" value={form.role} onValueChange={(v) => setForm({ ...form, role: v })} options={[
              { value: 'Cashier', label: 'Cashier' },
              { value: 'StoreManager', label: 'Store Manager' },
              { value: 'OrgAdmin', label: 'Org Admin' },
              ...(isSuperAdmin ? [{ value: 'SuperAdmin', label: 'Super Admin' }] : []),
            ]} />
            <FormSelect label="Default Store" value={form.defaultStoreId} onValueChange={(v) => setForm({ ...form, defaultStoreId: v })} options={[
              { value: '', label: 'None' },
              ...stores.map((s) => ({ value: s.id, label: s.name })),
            ]} />
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
