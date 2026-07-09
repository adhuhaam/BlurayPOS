import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function OnlineOrderingUpgradePage() {
  const { subscription } = useAuth();

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Online Ordering — plan upgrade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Accept pickup and delivery orders from your public order page.</p>
          <p>Your current plan: <strong className="text-foreground">{subscription?.planName ?? 'Free'}</strong></p>
          <Button render={<Link to="/billing" />}>Upgrade plan</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function OnlineOrderingModuleGate({ children }: { children: React.ReactNode }) {
  const { tenantFeatures } = useAuth();
  if (!tenantFeatures?.onlineOrdering) return <OnlineOrderingUpgradePage />;
  return <>{children}</>;
}
