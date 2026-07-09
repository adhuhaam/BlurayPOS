import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function OnlineMenuUpgradePage() {
  const { subscription } = useAuth();

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Online Menu — plan upgrade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Publish a digital menu and table QR codes for dine-in guests.</p>
          <p>Your current plan: <strong className="text-foreground">{subscription?.planName ?? 'Free'}</strong></p>
          <Button render={<Link to="/billing" />}>Upgrade plan</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function OnlineMenuModuleGate({ children }: { children: React.ReactNode }) {
  const { tenantFeatures } = useAuth();
  if (!tenantFeatures?.onlineMenu) return <OnlineMenuUpgradePage />;
  return <>{children}</>;
}
