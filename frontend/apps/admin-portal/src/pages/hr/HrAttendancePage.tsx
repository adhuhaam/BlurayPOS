import { useEffect, useState } from 'react';
import { api, ApiError, type AttendanceRecordDto, type EmployeeListItemDto, type StoreDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormSelect } from '@/components/form-select';
import { toast } from 'sonner';

export function HrAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItemDto[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [clockEmployeeId, setClockEmployeeId] = useState('');
  const [clockStoreId, setClockStoreId] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ employeeId: '', storeId: '', clockInAt: '', clockOutAt: '', notes: '' });

  const load = async () => {
    try {
      const [att, emps, strs] = await Promise.all([
        api.getAttendance({
          employeeId: filterEmployeeId || undefined,
          from: filterFrom ? new Date(filterFrom).toISOString() : undefined,
          to: filterTo ? new Date(`${filterTo}T23:59:59`).toISOString() : undefined,
        }),
        api.getEmployees(),
        api.getStores(),
      ]);
      setRecords(att);
      setEmployees(emps);
      setStores(strs);
      if (!clockStoreId && strs[0]) setClockStoreId(strs[0].id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load');
    }
  };

  useEffect(() => { load(); }, [filterEmployeeId, filterFrom, filterTo]);

  const clockIn = async () => {
    try {
      await api.clockIn({ employeeId: clockEmployeeId, storeId: clockStoreId });
      toast.success('Clocked in');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const clockOut = async () => {
    try {
      await api.clockOut({ employeeId: clockEmployeeId });
      toast.success('Clocked out');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const saveManual = async () => {
    if (!manual.employeeId || !manual.storeId || !manual.clockInAt) {
      toast.error('Employee, branch, and clock-in required');
      return;
    }
    try {
      await api.manualAttendance({
        employeeId: manual.employeeId,
        storeId: manual.storeId,
        clockInAt: new Date(manual.clockInAt).toISOString(),
        clockOutAt: manual.clockOutAt ? new Date(manual.clockOutAt).toISOString() : undefined,
        notes: manual.notes || undefined,
      });
      toast.success('Attendance recorded');
      setManualOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title="Attendance"
        description="Clock in/out, backdated manual entries, and team attendance log."
        actions={<Button variant="outline" onClick={() => setManualOpen(true)}>Manual entry</Button>}
      />

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <FormSelect label="Employee" value={clockEmployeeId} onChange={setClockEmployeeId}
            options={[{ value: '', label: 'Select…' }, ...employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]} />
          <FormSelect label="Branch" value={clockStoreId} onChange={setClockStoreId}
            options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <Button onClick={clockIn} disabled={!clockEmployeeId || !clockStoreId}>Clock in</Button>
          <Button variant="outline" onClick={clockOut} disabled={!clockEmployeeId}>Clock out</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <FormSelect label="Filter employee" value={filterEmployeeId} onChange={setFilterEmployeeId}
            options={[{ value: '', label: 'All employees' }, ...employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]} />
          <div><Label>From</Label><Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} /></div>
          <div><Label>To</Label><Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Employee</TableHead><TableHead>Branch</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead><TableHead>Source</TableHead><TableHead>Notes</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No attendance records</TableCell></TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.employeeName}</TableCell>
                  <TableCell>{r.storeName}</TableCell>
                  <TableCell>{new Date(r.clockInAt).toLocaleString()}</TableCell>
                  <TableCell>{r.clockOutAt ? new Date(r.clockOutAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{r.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.notes ?? '—'}</TableCell>
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
            <FormSelect label="Employee" value={manual.employeeId} onChange={(v) => setManual({ ...manual, employeeId: v })}
              options={[{ value: '', label: 'Select…' }, ...employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]} />
            <FormSelect label="Branch" value={manual.storeId} onChange={(v) => setManual({ ...manual, storeId: v })}
              options={stores.map((s) => ({ value: s.id, label: s.name }))} />
            <div><Label>Clock in</Label><Input type="datetime-local" value={manual.clockInAt} onChange={(e) => setManual({ ...manual, clockInAt: e.target.value })} /></div>
            <div><Label>Clock out (optional)</Label><Input type="datetime-local" value={manual.clockOutAt} onChange={(e) => setManual({ ...manual, clockOutAt: e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={manual.notes} onChange={(e) => setManual({ ...manual, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={saveManual}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
