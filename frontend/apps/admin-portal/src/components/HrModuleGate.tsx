import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HrUpgradePage() {
  const { subscription } = useAuth();

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Human Resources — Pro plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Manage employees, payroll, payslips, attendance, leave, schedules, and performance reviews.
          </p>
          <p>Your current plan: <strong className="text-foreground">{subscription?.planName ?? 'Free'}</strong></p>
          <Button render={<Link to="/billing" />}>Upgrade plan</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function HrModuleGate({ children }: { children: React.ReactNode }) {
  const { tenantFeatures } = useAuth();
  if (!tenantFeatures?.officeHr) return <HrUpgradePage />;
  return <>{children}</>;
}
