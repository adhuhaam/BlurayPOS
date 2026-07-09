import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CouponsUpgradePage() {
  const { subscription } = useAuth();

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Coupons & Lucky Draw — Pro plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Create QR coupon campaigns, print sticker sheets, and collect lucky draw entries on{' '}
            <strong className="text-foreground">coupons.bluraymaldives.site</strong>.
          </p>
          <p>Your current plan: <strong className="text-foreground">{subscription?.planName ?? 'Free'}</strong></p>
          <Button render={<Link to="/billing" />}>Upgrade to Pro</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function CouponsModuleGate({ children }: { children: React.ReactNode }) {
  const { tenantFeatures } = useAuth();
  if (!tenantFeatures?.officeCoupons) return <CouponsUpgradePage />;
  return <>{children}</>;
}
