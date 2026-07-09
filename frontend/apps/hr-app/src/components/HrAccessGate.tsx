import { links } from '@hr/config';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HrUpgradePage() {
  const { subscription } = useAuth();

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Human Resources — plan upgrade required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Employee records, payroll, attendance, leave, and scheduling require the HR module on your subscription plan.</p>
          <p>Your current plan: <strong className="text-foreground">{subscription?.planName ?? 'Free'}</strong></p>
          <Button render={<a href={links.officeBilling} target="_blank" rel="noopener noreferrer" />}>Upgrade in Store Admin</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function HrRoleGate({ children }: { children: React.ReactNode }) {
  const { roles } = useAuth();
  const allowed = roles.includes('OrgAdmin') || roles.includes('StoreManager');
  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <Card>
          <CardHeader><CardTitle>Access denied</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground">
            HR management is available to store managers only.
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

export function HrModuleGate({ children }: { children: React.ReactNode }) {
  const { tenantFeatures } = useAuth();
  if (!tenantFeatures?.officeHr) return <HrUpgradePage />;
  return <HrRoleGate>{children}</HrRoleGate>;
}
