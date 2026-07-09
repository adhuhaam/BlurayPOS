import { useEffect, useState } from 'react';
import { api, ApiError, type LeaveRequestDto, type LeaveTypeDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormSelect } from '@/components/form-select';
import { toast } from 'sonner';

export function HrLeavePage() {
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [types, setTypes] = useState<LeaveTypeDto[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeModal, setTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: '', isPaid: true, defaultDaysPerYear: 30 });

  const load = async () => {
    try {
      const [reqs, t] = await Promise.all([
        api.getLeaveRequests(statusFilter || undefined),
        api.getLeaveTypes(),
      ]);
      setRequests(reqs);
      setTypes(t);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load');
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const approve = async (id: string) => {
    try {
      await api.approveLeaveRequest(id);
      toast.success('Approved');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const reject = async (id: string) => {
    try {
      await api.rejectLeaveRequest(id);
      toast.success('Rejected');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const addType = async () => {
    if (!typeForm.name.trim()) { toast.error('Name is required'); return; }
    try {
      await api.createLeaveType(typeForm);
      toast.success('Leave type added');
      setTypeModal(false);
      setTypeForm({ name: '', isPaid: true, defaultDaysPerYear: 30 });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title="Leave management"
        description="Configure leave types, review requests, and approve time off."
        actions={<Button variant="outline" onClick={() => setTypeModal(true)}>Add leave type</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {types.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t.name}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t.defaultDaysPerYear} days/year · {t.isPaid ? 'Paid' : 'Unpaid'}
            </CardContent>
          </Card>
        ))}
      </div>

      <FormSelect label="Filter by status" value={statusFilter} onChange={setStatusFilter} className="max-w-xs"
        options={[
          { value: '', label: 'All requests' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Rejected', label: 'Rejected' },
        ]} />

      <Card>
        <CardHeader><CardTitle>Leave requests</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests</p>
          ) : requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <p className="font-medium">{r.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {r.leaveTypeName} · {r.daysRequested} days · {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                </p>
                {r.reason && <p className="text-sm mt-1">{r.reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'Pending' ? 'secondary' : r.status === 'Approved' ? 'default' : 'destructive'}>{r.status}</Badge>
                {r.status === 'Pending' && (
                  <>
                    <Button size="sm" onClick={() => approve(r.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={typeModal} onOpenChange={setTypeModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>New leave type</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>Name</Label><Input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="Annual leave" /></div>
            <div><Label>Days per year</Label><Input type="number" value={typeForm.defaultDaysPerYear} onChange={(e) => setTypeForm({ ...typeForm, defaultDaysPerYear: Number(e.target.value) })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={typeForm.isPaid} onChange={(e) => setTypeForm({ ...typeForm, isPaid: e.target.checked })} />
              Paid leave
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeModal(false)}>Cancel</Button>
            <Button onClick={addType}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
