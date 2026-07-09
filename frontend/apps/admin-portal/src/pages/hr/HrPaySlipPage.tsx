import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError, type PaySlipDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatPayPeriod } from '@/lib/hr-dates';

export function HrPaySlipPage() {
  const { id } = useParams<{ id: string }>();
  const [slip, setSlip] = useState<PaySlipDto | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getPaySlip(id).then(setSlip).catch((err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load payslip');
    });
  }, [id]);

  if (!slip) return null;

  return (
    <div className="space-y-6 print:space-y-4">
      <ModulePageHeader
        title="Pay slip"
        description={`${slip.employeeName} · ${slip.employeeNumber} · ${formatPayPeriod(slip.periodStart, slip.periodEnd)}`}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" render={<Link to="/hr/payroll" />}>← Payroll</Button>
            <Button onClick={() => window.print()}>Print</Button>
          </div>
        }
      />

      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center border-b">
          <CardTitle>Pay Slip</CardTitle>
          <p className="text-sm text-muted-foreground">{slip.employeeName} ({slip.employeeNumber})</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableBody>
              {slip.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.label}</TableCell>
                  <TableCell className="text-right">MVR {line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t">
                <TableCell>Gross pay</TableCell>
                <TableCell className="text-right">MVR {slip.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total deductions</TableCell>
                <TableCell className="text-right text-destructive">- MVR {slip.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
              <TableRow className="font-bold text-lg">
                <TableCell>Net pay</TableCell>
                <TableCell className="text-right">MVR {slip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
