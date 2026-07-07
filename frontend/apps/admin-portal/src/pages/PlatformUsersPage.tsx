import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PencilIcon, SearchIcon, UsersIcon } from 'lucide-react';
import {
  api,
  ApiError,
  type OrganizationListItemDto,
  type PlatformUserListItemDto,
  type UpdatePlatformUserRequest,
} from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  { value: 'SuperAdmin', label: 'Super Admin' },
  { value: 'OrgAdmin', label: 'Manager' },
  { value: 'StoreManager', label: 'Branch Manager' },
  { value: 'Cashier', label: 'Cashier' },
  { value: 'Waiter', label: 'Waiter' },
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Accountant', label: 'Accountant' },
];

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PlatformUsersPage() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<PlatformUserListItemDto[]>([]);
  const [stores, setStores] = useState<OrganizationListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState(searchParams.get('store') ?? '');
  const [editingUser, setEditingUser] = useState<PlatformUserListItemDto | null>(null);
  const [form, setForm] = useState<UpdatePlatformUserRequest & { newPassword: string }>({
    firstName: '',
    lastName: '',
    role: 'Cashier',
    isActive: true,
    newPassword: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [userList, storeList] = await Promise.all([
        api.getPlatformUsers({
          organizationId: storeFilter && storeFilter !== '__platform__' ? storeFilter : undefined,
          search: search.trim() || undefined,
        }),
        stores.length === 0 ? api.getOrganizations() : Promise.resolve(stores),
      ]);
      setUsers(
        storeFilter === '__platform__'
          ? userList.filter((u) => !u.organizationId)
          : userList,
      );
      if (stores.length === 0) setStores(storeList);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [storeFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    platform: users.filter((u) => !u.organizationId).length,
  }), [users]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const openEdit = (user: PlatformUserListItemDto) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      newPassword: '',
    });
  };

  const saveUser = async () => {
    if (!editingUser) return;
    try {
      await api.updatePlatformUser(editingUser.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        isActive: form.isActive,
        newPassword: form.newPassword.trim() || undefined,
      });
      toast.success(`Updated ${editingUser.email}`);
      setEditingUser(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update user');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform Users"
        description="View and manage all users across every store"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <UsersIcon className="size-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div>
              <p className="text-2xl font-bold">{stats.platform}</p>
              <p className="text-sm text-muted-foreground">Platform admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <FormSelect
          label=""
          value={storeFilter}
          onValueChange={setStoreFilter}
          options={[
            { value: '', label: 'All stores' },
            { value: '__platform__', label: 'Platform only' },
            ...stores.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.firstName} {u.lastName}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  {u.organizationId ? (
                    <Badge variant="secondary">{u.organizationName ?? 'Store'}</Badge>
                  ) : (
                    <Badge variant="outline">Platform</Badge>
                  )}
                </TableCell>
                <TableCell><Badge variant="outline">{roleLabel(u.role)}</Badge></TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'secondary' : 'destructive'}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                    <PencilIcon data-icon="inline-start" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editingUser !== null} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{editingUser.email}</span>
                {editingUser.organizationName && (
                  <span className="ml-3 text-muted-foreground">· {editingUser.organizationName}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>First name</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Last name</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <FormSelect
                label="Role"
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
                options={ROLE_OPTIONS}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Account active
              </label>
              <div className="flex flex-col gap-2">
                <Label>New password (optional)</Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={saveUser}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
