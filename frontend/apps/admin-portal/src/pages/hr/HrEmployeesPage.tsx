import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, UserPlusIcon } from 'lucide-react';
import { api, ApiError, type EmployeeListItemDto, type StoreDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormSelect } from '@/components/form-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { fromDateInputValue } from '@/lib/hr-dates';
import { toast } from 'sonner';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  nationality: '',
  idDocumentType: '',
  idDocumentNumber: '',
  dateOfBirth: '',
  hireDate: '',
  jobTitle: '',
  department: '',
  defaultStoreId: '',
};

export function HrEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeListItemDto[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try {
      const [list, storeList] = await Promise.all([
        api.getEmployees(search || undefined),
        api.getStores(),
      ]);
      setEmployees(list);
      setStores(storeList);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setSaving(true);
    try {
      const created = await api.createEmployee({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        idDocumentType: form.idDocumentType || undefined,
        idDocumentNumber: form.idDocumentNumber.trim() || undefined,
        dateOfBirth: fromDateInputValue(form.dateOfBirth),
        hireDate: fromDateInputValue(form.hireDate),
        jobTitle: form.jobTitle.trim() || undefined,
        department: form.department.trim() || undefined,
        defaultStoreId: form.defaultStoreId || undefined,
      });
      toast.success(`Employee ${created.employeeNumber} created`);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title="Employees"
        description="Add and manage your team — employees do not need a POS login. Linking happens automatically when email matches a store user."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon data-icon="inline-start" /> Add employee
          </Button>
        }
      />

      <Alert>
        <AlertDescription className="text-sm">
          <strong>HR-only staff</strong> (kitchen, delivery, back office) can be added here without creating a POS user.
          If you later add a user with the same email, profiles link automatically.
        </AlertDescription>
      </Alert>

      <Input
        placeholder="Search by name, email, or employee #"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No employees yet. Add your first team member — they do not need POS access.
                    </TableCell>
                  </TableRow>
                ) : employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-sm">{e.employeeNumber}</TableCell>
                    <TableCell>
                      <Link to={`/hr/employees/${e.id}`} className="font-medium hover:underline">
                        {e.firstName} {e.lastName}
                      </Link>
                      {e.email && <p className="text-xs text-muted-foreground">{e.email}</p>}
                    </TableCell>
                    <TableCell>{e.jobTitle ?? '—'}</TableCell>
                    <TableCell>{e.department ?? '—'}</TableCell>
                    <TableCell>{e.defaultStoreName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={e.employmentStatus === 'Active' ? 'default' : 'secondary'}>
                        {e.employmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.userId ? (
                        <Badge variant="outline">POS linked</Badge>
                      ) : (
                        <Badge variant="secondary">HR only</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlusIcon className="size-5" /> Add employee
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Last name *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nationality</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
              <div><Label>Hire date</Label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="ID type" value={form.idDocumentType} onChange={(v) => setForm({ ...form, idDocumentType: v })}
                options={[{ value: '', label: '—' }, { value: 'Nid', label: 'NID' }, { value: 'Passport', label: 'Passport' }]} />
              <div><Label>ID / Passport #</Label><Input value={form.idDocumentNumber} onChange={(e) => setForm({ ...form, idDocumentNumber: e.target.value })} /></div>
            </div>
            <div><Label>Date of birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Job title</Label><Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            </div>
            <FormSelect label="Default branch" value={form.defaultStoreId} onChange={(v) => setForm({ ...form, defaultStoreId: v })}
              options={[{ value: '', label: '—' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create employee'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
