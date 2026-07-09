import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  api, ApiError, type EmployeeDto, type EmployeeCompensationDto, type PayrollAdjustmentDto,
  type AttendanceRecordDto, type LeaveBalanceDto, type LeaveRequestDto, type WorkScheduleDto,
  type PerformanceReviewDto, type PaySlipDto, type StoreDto, type LeaveTypeDto,
} from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormSelect } from '@/components/form-select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { fromDateInputValue, formatPayPeriod, toDateInputValue } from '@/lib/hr-dates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TABS = ['profile', 'compensation', 'adjustments', 'attendance', 'leave', 'schedule', 'performance', 'payslips'] as const;
type TabId = typeof TABS[number];

function isTabId(value: string | null): value is TabId {
  return TABS.includes(value as TabId);
}

export function HrEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(isTabId(tabParam) ? tabParam : 'profile');
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [compensation, setCompensation] = useState<EmployeeCompensationDto | null>(null);
  const [adjustments, setAdjustments] = useState<PayrollAdjustmentDto[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecordDto[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceDto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [schedule, setSchedule] = useState<WorkScheduleDto[]>([]);
  const [reviews, setReviews] = useState<PerformanceReviewDto[]>([]);
  const [payslips, setPayslips] = useState<PaySlipDto[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams(tab === 'profile' ? {} : { tab }, { replace: true });
  };

  useEffect(() => {
    if (isTabId(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [emp, comp, adj, att, bal, leaves, sched, revs, slips, storeList, types] = await Promise.all([
        api.getEmployee(id),
        api.getEmployeeCompensation(id),
        api.getEmployeeAdjustments(id),
        api.getAttendance({ employeeId: id }),
        api.getEmployeeLeaveBalances(id),
        api.getLeaveRequests(),
        api.getEmployeeSchedule(id),
        api.getEmployeeReviews(id),
        api.getEmployeePaySlips(id),
        api.getStores(),
        api.getLeaveTypes(),
      ]);
      setEmployee(emp);
      setCompensation(comp);
      setAdjustments(adj);
      setAttendance(att);
      setLeaveBalances(bal);
      setLeaveRequests(leaves.filter((l) => l.employeeId === id));
      setSchedule(sched);
      setReviews(revs);
      setPayslips(slips);
      setStores(storeList);
      setLeaveTypes(types);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load employee');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const saveProfile = async () => {
    if (!employee || !id) return;
    try {
      await api.updateEmployee(id, {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email ?? undefined,
        phone: employee.phone ?? undefined,
        address: employee.address ?? undefined,
        nationality: employee.nationality ?? undefined,
        idDocumentType: employee.idDocumentType ?? undefined,
        idDocumentNumber: employee.idDocumentNumber ?? undefined,
        dateOfBirth: employee.dateOfBirth ?? undefined,
        hireDate: employee.hireDate ?? undefined,
        terminationDate: employee.terminationDate ?? undefined,
        jobTitle: employee.jobTitle ?? undefined,
        department: employee.department ?? undefined,
        employmentStatus: employee.employmentStatus,
        defaultStoreId: employee.defaultStoreId ?? undefined,
      });
      toast.success('Profile saved');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const saveDocumentPath = async () => {
    if (!employee || !id || !employee.idDocumentFilePath?.trim()) return;
    try {
      await api.updateEmployeeDocument(id, employee.idDocumentFilePath.trim());
      toast.success('Document reference saved');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const saveCompensation = async () => {
    if (!id || !compensation) return;
    try {
      await api.upsertEmployeeCompensation(id, {
        basicSalary: compensation.basicSalary,
        currency: compensation.currency,
        payFrequency: compensation.payFrequency,
        bankName: compensation.bankName ?? undefined,
        bankAccountNumber: compensation.bankAccountNumber ?? undefined,
        effectiveFrom: compensation.effectiveFrom,
      });
      toast.success('Compensation saved');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!employee) return <p className="text-muted-foreground">Employee not found.</p>;

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.employeeNumber} · ${employee.jobTitle ?? 'Employee'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {employee.userId ? (
              <Badge variant="outline">POS linked</Badge>
            ) : (
              <Badge variant="secondary">HR only — no POS login</Badge>
            )}
            <Button variant="outline" render={<Link to="/hr/employees" />}>← Back</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1 border-b pb-2">
        {TABS.map((tab) => (
          <Button key={tab} size="sm" variant={activeTab === tab ? 'default' : 'ghost'}
            className={cn('capitalize')} onClick={() => selectTab(tab)}>
            {tab === 'payslips' ? 'Payslips' : tab}
          </Button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <CardHeader><CardTitle>Personal & employment</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>First name</Label><Input value={employee.firstName} onChange={(e) => setEmployee({ ...employee, firstName: e.target.value })} /></div>
            <div><Label>Last name</Label><Input value={employee.lastName} onChange={(e) => setEmployee({ ...employee, lastName: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={employee.email ?? ''} onChange={(e) => setEmployee({ ...employee, email: e.target.value })} placeholder="Optional — links to POS user if matched" /></div>
            <div><Label>Phone</Label><Input value={employee.phone ?? ''} onChange={(e) => setEmployee({ ...employee, phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Address</Label><Input value={employee.address ?? ''} onChange={(e) => setEmployee({ ...employee, address: e.target.value })} /></div>
            <div><Label>Nationality</Label><Input value={employee.nationality ?? ''} onChange={(e) => setEmployee({ ...employee, nationality: e.target.value })} /></div>
            <div><Label>Date of birth</Label><Input type="date" value={toDateInputValue(employee.dateOfBirth)} onChange={(e) => setEmployee({ ...employee, dateOfBirth: fromDateInputValue(e.target.value) ?? null })} /></div>
            <FormSelect label="ID type" value={employee.idDocumentType ?? ''} onChange={(v) => setEmployee({ ...employee, idDocumentType: v || null })}
              options={[{ value: '', label: '—' }, { value: 'Nid', label: 'NID' }, { value: 'Passport', label: 'Passport' }]} />
            <div><Label>ID / Passport number</Label><Input value={employee.idDocumentNumber ?? ''} onChange={(e) => setEmployee({ ...employee, idDocumentNumber: e.target.value })} /></div>
            <div className="sm:col-span-2 flex gap-2 items-end">
              <div className="flex-1"><Label>Document file path / URL</Label><Input value={employee.idDocumentFilePath ?? ''} onChange={(e) => setEmployee({ ...employee, idDocumentFilePath: e.target.value })} placeholder="Storage path or secure URL" /></div>
              <Button variant="outline" onClick={saveDocumentPath} disabled={!employee.idDocumentFilePath?.trim()}>Save doc</Button>
            </div>
            <div><Label>Job title</Label><Input value={employee.jobTitle ?? ''} onChange={(e) => setEmployee({ ...employee, jobTitle: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={employee.department ?? ''} onChange={(e) => setEmployee({ ...employee, department: e.target.value })} /></div>
            <div><Label>Hire date</Label><Input type="date" value={toDateInputValue(employee.hireDate)} onChange={(e) => setEmployee({ ...employee, hireDate: fromDateInputValue(e.target.value) ?? null })} /></div>
            <FormSelect label="Branch" value={employee.defaultStoreId ?? ''} onChange={(v) => setEmployee({ ...employee, defaultStoreId: v || null })}
              options={[{ value: '', label: '—' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]} />
            <FormSelect label="Status" value={employee.employmentStatus} onChange={(v) => setEmployee({ ...employee, employmentStatus: v })}
              options={[{ value: 'Active', label: 'Active' }, { value: 'OnLeave', label: 'On leave' }, { value: 'Terminated', label: 'Terminated' }]} />
            {employee.employmentStatus === 'Terminated' && (
              <div><Label>Termination date</Label><Input type="date" value={toDateInputValue(employee.terminationDate)} onChange={(e) => setEmployee({ ...employee, terminationDate: fromDateInputValue(e.target.value) ?? null })} /></div>
            )}
            {employee.userId ? (
              <div className="sm:col-span-2 text-sm text-muted-foreground">Linked POS user · <Link to="/users" className="underline">Users & Roles</Link></div>
            ) : (
              <div className="sm:col-span-2 text-sm text-muted-foreground">This employee has no POS login. Add a user with the same email to link accounts automatically.</div>
            )}
            <div className="sm:col-span-2"><Button onClick={saveProfile}>Save profile</Button></div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'compensation' && (
        <Card>
          <CardHeader><CardTitle>Salary & bank</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Basic salary</Label>
              <Input type="number" value={compensation?.basicSalary ?? 0} onChange={(e) => setCompensation({
                ...(compensation ?? { id: '', employeeId: id!, basicSalary: 0, currency: 'MVR', payFrequency: 'Monthly', bankName: null, bankAccountNumber: null, effectiveFrom: new Date().toISOString() }),
                basicSalary: Number(e.target.value),
              })} /></div>
            <div><Label>Currency</Label><Input value={compensation?.currency ?? 'MVR'} onChange={(e) => compensation && setCompensation({ ...compensation, currency: e.target.value })} /></div>
            <FormSelect label="Pay frequency" value={compensation?.payFrequency ?? 'Monthly'} onChange={(v) => compensation && setCompensation({ ...compensation, payFrequency: v })}
              options={[{ value: 'Monthly', label: 'Monthly' }, { value: 'BiWeekly', label: 'Bi-weekly' }]} />
            <div><Label>Effective from</Label><Input type="date" value={toDateInputValue(compensation?.effectiveFrom)} onChange={(e) => compensation && setCompensation({ ...compensation, effectiveFrom: fromDateInputValue(e.target.value) ?? compensation.effectiveFrom })} /></div>
            <div><Label>Bank name</Label><Input value={compensation?.bankName ?? ''} onChange={(e) => compensation && setCompensation({ ...compensation, bankName: e.target.value })} /></div>
            <div><Label>Account number</Label><Input value={compensation?.bankAccountNumber ?? ''} onChange={(e) => compensation && setCompensation({ ...compensation, bankAccountNumber: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={saveCompensation} disabled={!compensation}>Save compensation</Button></div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'adjustments' && <AdjustmentsTab employeeId={id!} items={adjustments} onRefresh={load} />}
      {activeTab === 'attendance' && <EmployeeAttendanceTab employeeId={id!} records={attendance} stores={stores} onRefresh={load} />}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Leave balances</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaveBalances.length === 0 ? <p className="text-sm text-muted-foreground">No balances yet — approved leave creates balances automatically.</p> : leaveBalances.map((b) => (
                <div key={b.id} className="flex justify-between text-sm">
                  <span>{b.leaveTypeName}</span>
                  <span>{b.remainingDays} / {b.entitledDays} days left</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <LeaveRequestTab employeeId={id!} leaveTypes={leaveTypes} requests={leaveRequests} onRefresh={load} />
        </div>
      )}
      {activeTab === 'schedule' && <ScheduleTab employeeId={id!} schedule={schedule} stores={stores} onRefresh={load} />}
      {activeTab === 'performance' && <PerformanceTab employeeId={id!} reviews={reviews} onRefresh={load} />}
      {activeTab === 'payslips' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {payslips.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No payslips yet</TableCell></TableRow>
                ) : payslips.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatPayPeriod(p.periodStart, p.periodEnd)}</TableCell>
                    <TableCell>MVR {p.grossPay.toLocaleString()}</TableCell>
                    <TableCell>MVR {p.netPay.toLocaleString()}</TableCell>
                    <TableCell><Link to={`/hr/payslips/${p.id}`} className="text-primary underline text-sm">View</Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdjustmentsTab({ employeeId, items, onRefresh }: { employeeId: string; items: PayrollAdjustmentDto[]; onRefresh: () => void }) {
  const [form, setForm] = useState({
    type: 'Increment', label: '', amount: 0, isRecurring: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
  });

  const add = async () => {
    if (!form.label.trim()) { toast.error('Label is required'); return; }
    try {
      await api.createPayrollAdjustment(employeeId, {
        type: form.type,
        label: form.label.trim(),
        amount: form.amount,
        isRecurring: form.isRecurring,
        effectiveFrom: fromDateInputValue(form.effectiveFrom) ?? new Date().toISOString(),
        effectiveTo: form.effectiveTo ? fromDateInputValue(form.effectiveTo) : undefined,
      });
      toast.success('Adjustment added');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const remove = async (adjustmentId: string) => {
    if (!confirm('Remove this adjustment?')) return;
    try {
      await api.deletePayrollAdjustment(employeeId, adjustmentId);
      toast.success('Removed');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Increments & deductions</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormSelect label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })}
            options={[{ value: 'Increment', label: 'Increment' }, { value: 'Deduction', label: 'Deduction' }]} />
          <div><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <div><Label>Amount (MVR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
          <div><Label>Effective from</Label><Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></div>
          <div><Label>Effective to (optional)</Label><Input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
            Recurring each payroll
          </label>
        </div>
        <Button onClick={add}>Add adjustment</Button>
        <Table>
          <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Label</TableHead><TableHead>Amount</TableHead><TableHead>Schedule</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id}>
                <TableCell><Badge>{a.type}</Badge></TableCell>
                <TableCell>{a.label}</TableCell>
                <TableCell>MVR {a.amount.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.isRecurring ? 'Recurring' : 'One-time'}
                  {a.effectiveFrom && ` · from ${new Date(a.effectiveFrom).toLocaleDateString()}`}
                </TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => remove(a.id)}>Remove</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EmployeeAttendanceTab({ employeeId, records, stores, onRefresh }: {
  employeeId: string; records: AttendanceRecordDto[]; stores: StoreDto[]; onRefresh: () => void;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ storeId: '', clockInAt: '', clockOutAt: '', notes: '' });

  const clockIn = async () => {
    const storeId = manual.storeId || stores[0]?.id;
    if (!storeId) return;
    try {
      await api.clockIn({ employeeId, storeId });
      toast.success('Clocked in');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const clockOut = async () => {
    try {
      await api.clockOut({ employeeId });
      toast.success('Clocked out');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const saveManual = async () => {
    if (!manual.storeId || !manual.clockInAt) { toast.error('Branch and clock-in time required'); return; }
    try {
      await api.manualAttendance({
        employeeId,
        storeId: manual.storeId,
        clockInAt: new Date(manual.clockInAt).toISOString(),
        clockOutAt: manual.clockOutAt ? new Date(manual.clockOutAt).toISOString() : undefined,
        notes: manual.notes || undefined,
      });
      toast.success('Attendance recorded');
      setManualOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-2">
          <Button onClick={clockIn}>Clock in now</Button>
          <Button variant="outline" onClick={clockOut}>Clock out now</Button>
          <Button variant="secondary" onClick={() => { setManual({ storeId: stores[0]?.id ?? '', clockInAt: '', clockOutAt: '', notes: '' }); setManualOpen(true); }}>Manual entry</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Clock in</TableHead><TableHead>Clock out</TableHead><TableHead>Branch</TableHead><TableHead>Source</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {records.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.clockInAt).toLocaleString()}</TableCell>
                  <TableCell>{a.clockOutAt ? new Date(a.clockOutAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{a.storeName}</TableCell>
                  <TableCell>{a.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.notes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual attendance entry</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <FormSelect label="Branch" value={manual.storeId} onChange={(v) => setManual({ ...manual, storeId: v })}
              options={stores.map((s) => ({ value: s.id, label: s.name }))} />
            <div><Label>Clock in</Label><Input type="datetime-local" value={manual.clockInAt} onChange={(e) => setManual({ ...manual, clockInAt: e.target.value })} /></div>
            <div><Label>Clock out (optional)</Label><Input type="datetime-local" value={manual.clockOutAt} onChange={(e) => setManual({ ...manual, clockOutAt: e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={manual.notes} onChange={(e) => setManual({ ...manual, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={saveManual}>Save entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeaveRequestTab({ employeeId, leaveTypes, requests, onRefresh }: {
  employeeId: string; leaveTypes: LeaveTypeDto[]; requests: LeaveRequestDto[]; onRefresh: () => void;
}) {
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  const submit = async () => {
    if (!form.leaveTypeId || !form.startDate || !form.endDate) { toast.error('Fill in leave type and dates'); return; }
    try {
      await api.createLeaveRequest({
        employeeId,
        leaveTypeId: form.leaveTypeId,
        startDate: fromDateInputValue(form.startDate) ?? new Date(form.startDate).toISOString(),
        endDate: fromDateInputValue(form.endDate) ?? new Date(form.endDate).toISOString(),
        reason: form.reason.trim() || undefined,
      });
      toast.success('Leave request submitted');
      setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Leave requests</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormSelect label="Leave type" value={form.leaveTypeId} onChange={(v) => setForm({ ...form, leaveTypeId: v })}
            options={[{ value: '', label: 'Select…' }, ...leaveTypes.map((t) => ({ value: t.id, label: t.name }))]} />
          <div><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><Label>End date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional" /></div>
        </div>
        <Button onClick={submit}>Submit request</Button>
        {requests.map((r) => (
          <div key={r.id} className="flex justify-between border-b pb-2 text-sm">
            <span>{r.leaveTypeName} · {r.daysRequested} days · <Badge variant="secondary">{r.status}</Badge>{r.reason && ` · ${r.reason}`}</span>
            <span>{new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ScheduleTab({ employeeId, schedule, stores, onRefresh }: {
  employeeId: string; schedule: WorkScheduleDto[]; stores: StoreDto[]; onRefresh: () => void;
}) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [items, setItems] = useState<Record<string, { start: string; end: string; storeId: string }>>({});

  useEffect(() => {
    const map: Record<string, { start: string; end: string; storeId: string }> = {};
    schedule.forEach((s) => { map[s.dayOfWeek] = { start: s.startTime, end: s.endTime, storeId: s.storeId }; });
    setItems(map);
  }, [schedule]);

  const save = async () => {
    const payload = days.filter((d) => items[d]?.storeId).map((d) => ({
      dayOfWeek: d,
      startTime: items[d].start || '09:00',
      endTime: items[d].end || '17:00',
      storeId: items[d].storeId,
    }));
    try {
      await api.upsertEmployeeSchedule(employeeId, payload);
      toast.success('Schedule saved');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Weekly schedule</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {days.map((d) => (
          <div key={d} className="grid grid-cols-4 gap-2 items-center">
            <span className="text-sm font-medium">{d}</span>
            <Input type="time" value={items[d]?.start ?? ''} onChange={(e) => setItems({ ...items, [d]: { ...items[d], start: e.target.value, end: items[d]?.end ?? '17:00', storeId: items[d]?.storeId ?? '' } })} />
            <Input type="time" value={items[d]?.end ?? ''} onChange={(e) => setItems({ ...items, [d]: { ...items[d], end: e.target.value, start: items[d]?.start ?? '09:00', storeId: items[d]?.storeId ?? '' } })} />
            <FormSelect label="" value={items[d]?.storeId ?? ''} onChange={(v) => setItems({ ...items, [d]: { start: items[d]?.start ?? '09:00', end: items[d]?.end ?? '17:00', storeId: v } })}
              options={[{ value: '', label: 'Off' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]} />
          </div>
        ))}
        <Button onClick={save}>Save schedule</Button>
      </CardContent>
    </Card>
  );
}

function PerformanceTab({ employeeId, reviews, onRefresh }: { employeeId: string; reviews: PerformanceReviewDto[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ reviewPeriod: '', rating: 3, summary: '' });

  const add = async () => {
    if (!form.reviewPeriod.trim()) { toast.error('Review period is required'); return; }
    try {
      await api.createPerformanceReview(employeeId, {
        reviewPeriod: form.reviewPeriod.trim(),
        rating: form.rating,
        summary: form.summary.trim() || undefined,
      });
      toast.success('Review added');
      setForm({ reviewPeriod: '', rating: 3, summary: '' });
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Performance reviews</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Period</Label><Input placeholder="Q1 2026" value={form.reviewPeriod} onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })} /></div>
          <div><Label>Rating (1–5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2"><Label>Summary</Label><Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Strengths, goals, feedback…" /></div>
        </div>
        <Button onClick={add}>Add review</Button>
        {reviews.map((r) => (
          <div key={r.id} className="border-b pb-3">
            <p className="font-medium">{r.reviewPeriod} · {'★'.repeat(r.rating)}</p>
            <p className="text-sm text-muted-foreground">{r.summary ?? 'No summary'}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(r.reviewedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
