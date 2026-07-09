import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, BanIcon, CheckCircleIcon, ShieldIcon } from 'lucide-react';
import { api, ApiError, type UserListItemDto, type StoreDto, type UpdateUserRequest, type EmployeeListItemDto } from '@pos/api-client';
import { useAuth } from '@/auth';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  { value: 'OrgAdmin', label: 'Manager' },
  { value: 'StoreManager', label: 'Branch Manager' },
  { value: 'Cashier', label: 'Cashier' },
  { value: 'Waiter', label: 'Waiter' },
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Accountant', label: 'Accountant' },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

const POS_PERMISSIONS = [
  { code: 'Pos.Access', label: 'Access POS terminal', hint: 'Required to log into the register' },
  { code: 'Order.View', label: 'View orders', hint: 'See order list in admin portal' },
  { code: 'Sale.Create', label: 'Create & complete sales', hint: 'Ring up and pay orders' },
  { code: 'Sale.Edit', label: 'Edit draft orders', hint: 'Change items on open tickets' },
  { code: 'Sale.Discount', label: 'Apply discounts', hint: 'Line or order-level discounts' },
  { code: 'Sale.Void', label: 'Void orders', hint: 'Cancel draft or held orders' },
];

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function UsersPage() {
  const { roles, user: currentUser, tenantFeatures } = useAuth();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [employeesByUserId, setEmployeesByUserId] = useState<Record<string, string>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItemDto | null>(null);
  const [createForm, setCreateForm] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'Cashier', defaultStoreId: '',
  });
  const [editForm, setEditForm] = useState<UpdateUserRequest & { newPassword: string }>({
    firstName: '', lastName: '', role: 'Cashier', defaultStoreId: '', isActive: true, newPassword: '',
  });

  const [manageableRoles, setManageableRoles] = useState<string[]>([]);
  const [permRole, setPermRole] = useState('Cashier');
  const [permCodes, setPermCodes] = useState<string[]>([]);
  const [permDefaults, setPermDefaults] = useState<string[]>([]);
  const [permCustomized, setPermCustomized] = useState(false);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);

  const canManage = roles.includes('OrgAdmin');

  const load = async () => {
    try {
      const [userList, storeList] = await Promise.all([api.getUsers(), api.getStores()]);
      setUsers(userList);
      setStores(storeList);
      if (tenantFeatures?.officeHr) {
        const employees = await api.getEmployees();
        const map: Record<string, string> = {};
        employees.forEach((e: EmployeeListItemDto) => {
          if (e.userId) map[e.userId] = e.id;
        });
        setEmployeesByUserId(map);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load users');
    }
  };

  const loadRolePermissions = async (role: string) => {
    setPermLoading(true);
    try {
      const data = await api.getRolePermissions(role);
      setPermCodes(data.permissions);
      setPermDefaults(data.defaults);
      setPermCustomized(data.isCustomized);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load role permissions');
    } finally {
      setPermLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    load();
    api.getManageableRoles().then((r) => {
      setManageableRoles(r);
      if (r[0]) setPermRole(r.includes('Cashier') ? 'Cashier' : r[0]);
    });
  }, [canManage]);

  useEffect(() => {
    if (canManage && permRole) loadRolePermissions(permRole);
  }, [permRole, canManage]);

  const togglePerm = (code: string) => {
    setPermCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const saveRolePermissions = async () => {
    setPermSaving(true);
    try {
      const data = await api.setRolePermissions(permRole, permCodes);
      setPermCodes(data.permissions);
      setPermCustomized(data.isCustomized);
      toast.success(`${roleLabel(permRole)} access updated — staff must re-login to apply`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save permissions');
    } finally {
      setPermSaving(false);
    }
  };

  const resetRolePermissions = async () => {
    setPermSaving(true);
    try {
      const data = await api.setRolePermissions(permRole, permDefaults);
      setPermCodes(data.permissions);
      setPermCustomized(false);
      toast.success(`Reset ${roleLabel(permRole)} to standard defaults`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reset permissions');
    } finally {
      setPermSaving(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createUser({
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        role: createForm.role,
        defaultStoreId: createForm.defaultStoreId || undefined,
      });
      toast.success(`User ${createForm.email} created`);
      setCreateModalOpen(false);
      setCreateForm({ email: '', password: '', firstName: '', lastName: '', role: 'Cashier', defaultStoreId: '' });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create user');
    }
  };

  const openEdit = (u: UserListItemDto) => {
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      defaultStoreId: u.defaultStoreId ?? '',
      isActive: u.isActive,
      newPassword: '',
    });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      await api.updateUser(editingUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        role: editForm.role,
        defaultStoreId: editForm.defaultStoreId || undefined,
        isActive: editForm.isActive,
        newPassword: editForm.newPassword.trim() || undefined,
      });
      toast.success(`Updated ${editingUser.email}`);
      setEditingUser(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update user');
    }
  };

  const toggleSuspend = async (u: UserListItemDto) => {
    try {
      await api.updateUser(u.id, {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        defaultStoreId: u.defaultStoreId ?? undefined,
        isActive: !u.isActive,
      });
      toast.success(u.isActive ? `${u.email} suspended` : `${u.email} activated`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update user status');
    }
  };

  const isSelf = (u: UserListItemDto) => currentUser?.id === u.id;

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Users" />
        <p className="text-muted-foreground">Manager access required to manage users.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users & Access"
        description="Assign roles and customize what each role can do in POS and orders"
        action={<Button onClick={() => setCreateModalOpen(true)}><PlusIcon data-icon="inline-start" />Create User</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldIcon className="size-4" />
            Role access levels
          </CardTitle>
          <CardDescription>
            Standard POS rules: <strong>Cashier</strong> — POS + orders + discounts, no void.
            <strong> Waiter</strong> — POS + orders only, no void or discounts.
            Changes apply per store; users must log out and back in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormSelect
            label="Role to configure"
            value={permRole}
            onValueChange={setPermRole}
            options={manageableRoles.map((r) => ({ value: r, label: roleLabel(r) }))}
            className="max-w-xs"
          />
          {permCustomized && (
            <Badge variant="outline">Customized for your store</Badge>
          )}
          {permLoading ? (
            <p className="text-sm text-muted-foreground">Loading permissions…</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {POS_PERMISSIONS.map((p) => (
                <label key={p.code} className="flex cursor-pointer gap-3 rounded-lg border p-3 hover:bg-muted/30">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary"
                    checked={permCodes.includes(p.code)}
                    onChange={() => togglePerm(p.code)}
                  />
                  <span>
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={saveRolePermissions} disabled={permSaving || permLoading}>Save access</Button>
            <Button variant="outline" onClick={resetRolePermissions} disabled={permSaving || permLoading}>
              Reset to defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No users yet
                </TableCell>
              </TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id} className={!u.isActive ? 'opacity-60' : undefined}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{u.firstName} {u.lastName}</TableCell>
                <TableCell><Badge variant="secondary">{roleLabel(u.role)}</Badge></TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'secondary' : 'destructive'}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {tenantFeatures?.officeHr && employeesByUserId[u.id] && (
                      <Button variant="ghost" size="sm" render={<Link to={`/hr/employees/${employeesByUserId[u.id]}`} />}>
                        HR profile
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                      <PencilIcon data-icon="inline-start" />
                      Edit
                    </Button>
                    {!isSelf(u) && (
                      <Button variant="ghost" size="sm" onClick={() => toggleSuspend(u)}>
                        {u.isActive ? (
                          <><BanIcon data-icon="inline-start" />Suspend</>
                        ) : (
                          <><CheckCircleIcon data-icon="inline-start" />Activate</>
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Email</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Password</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>First Name</Label><Input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Last Name</Label><Input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} /></div>
            </div>
            <FormSelect label="Role" value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })} options={ROLE_OPTIONS.filter((r) => r.value !== 'OrgAdmin')} />
            <FormSelect label="Default branch" value={createForm.defaultStoreId} onValueChange={(v) => setCreateForm({ ...createForm, defaultStoreId: v })} options={[
              { value: '', label: 'None' },
              ...stores.map((s) => ({ value: s.id, label: s.name })),
            ]} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingUser !== null} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>
          {editingUser && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{editingUser.email}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2"><Label>First name</Label><Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
                <div className="flex flex-col gap-2"><Label>Last name</Label><Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
              </div>
              <FormSelect
                label="Role"
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                options={ROLE_OPTIONS.filter((r) => r.value !== 'OrgAdmin' || editingUser.role === 'OrgAdmin')}
              />
              <FormSelect label="Default branch" value={editForm.defaultStoreId ?? ''} onValueChange={(v) => setEditForm({ ...editForm, defaultStoreId: v })} options={[
                { value: '', label: 'None' },
                ...stores.map((s) => ({ value: s.id, label: s.name })),
              ]} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={editForm.isActive}
                  disabled={isSelf(editingUser)}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                Account active
              </label>
              <div className="flex flex-col gap-2">
                <Label>New password (optional)</Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

