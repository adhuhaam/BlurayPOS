import { useEffect, useState } from 'react';
import { PlusIcon, Building2Icon } from 'lucide-react';
import { api, type OrganizationListItemDto, type PlanDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormSelect } from '@/components/form-select';
import { toast } from 'sonner';

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationListItemDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', planId: '',
    adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
  });

  const load = async () => {
    setLoading(true);
    const [orgList, planList] = await Promise.all([api.getOrganizations(), api.getPlans()]);
    setOrgs(orgList);
    setPlans(planList);
    if (!form.planId && planList.length > 0) {
      setForm((f) => ({ ...f, planId: planList[0].id }));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await api.createOrganization({
        name: form.name,
        slug: form.slug,
        planId: form.planId,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
      });
      toast.success(`Tenant "${form.name}" provisioned with org admin`);
      setModalOpen(false);
      setForm({ name: '', slug: '', planId: plans[0]?.id ?? '', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '' });
      load();
    } catch {
      toast.error('Failed to create organization');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Organizations"
        description="Platform tenants — each org gets its own subscription and org admin"
        action={<Button onClick={() => setModalOpen(true)}><PlusIcon data-icon="inline-start" />New Tenant</Button>}
      />
      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stores</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2Icon className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{o.name}</div>
                        <div className="text-xs text-muted-foreground">{o.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{o.planName}</TableCell>
                  <TableCell><Badge variant="secondary">{o.subscriptionStatus}</Badge></TableCell>
                  <TableCell>{o.storeCount}</TableCell>
                  <TableCell>{o.userCount}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Provision New Tenant</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Organization Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="acme-corp" /></div>
            </div>
            <FormSelect label="Plan" value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })} options={plans.map((p) => ({ value: p.id, label: `${p.name} — $${p.priceMonthly}/mo` }))} />
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">An Org Admin account will be created for this tenant.</div>
            <div className="flex flex-col gap-2"><Label>Admin Email</Label><Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Admin Password</Label><Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>First Name</Label><Input value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Last Name</Label><Input value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Provision Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
