import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, type WorkScheduleDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export function HrSchedulingPage() {
  const [schedule, setSchedule] = useState<WorkScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSchedulingOverview()
      .then(setSchedule)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title="Scheduling"
        description="Weekly work schedules across the team. Edit shifts on each employee profile."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : schedule.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No schedules configured yet</TableCell></TableRow>
              ) : schedule.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.employeeName}</TableCell>
                  <TableCell>{s.dayOfWeek}</TableCell>
                  <TableCell>{s.startTime} – {s.endTime}</TableCell>
                  <TableCell>{s.storeName}</TableCell>
                  <TableCell>
                    <Link to={`/hr/employees/${s.employeeId}?tab=schedule`} className="text-sm underline">Edit schedule</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
