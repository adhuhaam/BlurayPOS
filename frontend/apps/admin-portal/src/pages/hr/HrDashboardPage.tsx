import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, CalendarIcon, WalletIcon, ClockIcon } from 'lucide-react';
import { api, type HrDashboardDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function HrDashboardPage() {
  const [data, setData] = useState<HrDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHrDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64 w-full" />;

  const stats = [
    { label: 'Total employees', value: data?.totalEmployees ?? 0, icon: UsersIcon },
    { label: 'Active', value: data?.activeEmployees ?? 0, icon: UsersIcon },
    { label: 'Pending leave', value: data?.pendingLeaveRequests ?? 0, icon: CalendarIcon },
    { label: 'Open payroll runs', value: data?.openPayrollRuns ?? 0, icon: WalletIcon },
  ];

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title="Human Resources"
        description="Employee records, payroll, attendance, and leave management."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" render={<Link to="/hr/employees" />}>Employees</Button>
            <Button variant="outline" render={<Link to="/hr/payroll" />}>Payroll</Button>
            <Button variant="outline" render={<Link to="/hr/attendance" />}>Attendance</Button>
            <Button render={<Link to="/hr/employees" />}>View team</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className="size-4" /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClockIcon className="size-5" /> Recent leave requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.recentLeaveRequests ?? []).length === 0 && (
            <p className="text-muted-foreground text-sm">No pending leave requests.</p>
          )}
          {(data?.recentLeaveRequests ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">{r.employeeName}</p>
                <p className="text-sm text-muted-foreground">{r.leaveTypeName} · {r.daysRequested} days</p>
              </div>
              <Badge variant="secondary">{r.status}</Badge>
            </div>
          ))}
          <Button variant="link" className="px-0" render={<Link to="/hr/leave" />}>Manage leave →</Button>
        </CardContent>
      </Card>
    </div>
  );
}
