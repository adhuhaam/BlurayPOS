import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { api, ApiError, type PayrollRunDto, type PaySlipDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function HrPayrollPage() {
  const [runs, setRuns] = useState<PayrollRunDto[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRunDto | null>(null);
  const [payslips, setPayslips] = useState<PaySlipDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ periodStart: '', periodEnd: '' });

  const load = async () => {
    try {
      setRuns(await api.getPayrollRuns());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load payroll');
    }
  };

  useEffect(() => { load(); }, []);

  const createRun = async () => {
    try {
      await api.createPayrollRun({
        periodStart: new Date(form.periodStart).toISOString(),
        periodEnd: new Date(form.periodEnd).toISOString(),
      });
      toast.success('Payroll run created');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const openRun = async (run: PayrollRunDto) => {
    setSelectedRun(run);
    setPayslips(await api.getPayrollRunPaySlips(run.id));
  };

  const generate = async (id: string) => {
    try {
      const updated = await api.generatePayrollRun(id);
      toast.success('Payslips generated');
      setSelectedRun(updated);
      setPayslips(await api.getPayrollRunPaySlips(id));
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const finalize = async (id: string) => {
    try {
      await api.finalizePayrollRun(id);
      toast.success('Payroll finalized');
      load();
      if (selectedRun?.id === id) {
        const updated = (await api.getPayrollRuns()).find((r) => r.id === id) ?? null;
        setSelectedRun(updated);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title="Payroll"
        description="Create payroll periods, generate payslips, and finalize runs."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon data-icon="inline-start" /> New payroll run
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Payroll runs</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Payslips</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id} className={selectedRun?.id === r.id ? 'bg-muted/50' : ''}>
                    <TableCell>{new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={r.status === 'Finalized' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                    <TableCell>{r.paySlipCount}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => openRun(r)}>Open</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedRun && (
          <Card>
            <CardHeader>
              <CardTitle>Run details</CardTitle>
              <div className="flex gap-2 pt-2">
                {selectedRun.status === 'Draft' && (
                  <>
                    <Button size="sm" onClick={() => generate(selectedRun.id)}>Generate payslips</Button>
                    <Button size="sm" variant="secondary" onClick={() => finalize(selectedRun.id)} disabled={selectedRun.paySlipCount === 0}>Finalize</Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Net pay</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {payslips.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.employeeName}</TableCell>
                      <TableCell>MVR {p.netPay.toLocaleString()}</TableCell>
                      <TableCell><Link to={`/hr/payslips/${p.id}`} className="text-sm underline">View payslip</Link></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New payroll run</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>Period start</Label><Input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} /></div>
            <div><Label>Period end</Label><Input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={createRun}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
