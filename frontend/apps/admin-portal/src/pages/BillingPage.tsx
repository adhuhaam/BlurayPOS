import { useEffect, useState } from 'react';
import { CreditCardIcon, CheckIcon } from 'lucide-react';
import { api, type PlanDto } from '@pos/api-client';
import { useAuth } from '@/auth';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function UsageBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BillingPage() {
  const { subscription, refreshProfile, isOrgAdmin } = useAuth();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlans().then((p) => { setPlans(p); setLoading(false); });
  }, []);

  const handleChangePlan = async (planId: string) => {
    try {
      await api.changePlan({ planId });
      await refreshProfile();
      toast.success('Plan updated');
    } catch {
      toast.error('Failed to change plan');
    }
  };

  const handleCheckout = async (planId: string) => {
    try {
      const result = await api.createCheckout({ planId });
      toast.info(result.message);
    } catch {
      toast.error('Checkout unavailable');
    }
  };

  if (!isOrgAdmin) {
    return (
      <div>
        <PageHeader title="Billing" />
        <p className="text-muted-foreground">Org admin access required.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Billing & Plans" description="Manage your subscription and usage limits" />
      {loading ? (
        <Skeleton className="h-48" />
      ) : subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="size-5" />
                  {subscription.planName} Plan
                </CardTitle>
                <CardDescription>${subscription.priceMonthly}/month · {subscription.status}</CardDescription>
              </div>
              <Badge>{subscription.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Stores</span>
                <span>{subscription.storeCount} / {subscription.maxStores}</span>
              </div>
              <UsageBar value={subscription.storeCount} max={subscription.maxStores} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Users</span>
                <span>{subscription.userCount} / {subscription.maxUsers}</span>
              </div>
              <UsageBar value={subscription.userCount} max={subscription.maxUsers} />
            </div>
            <p className="text-sm text-muted-foreground">
              Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} — {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">No active subscription.</p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.planId === plan.id;
          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">${plan.priceMonthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="flex flex-col gap-1">
                  <li className="flex items-center gap-2"><CheckIcon className="size-4 text-primary" />{plan.maxStores} stores</li>
                  <li className="flex items-center gap-2"><CheckIcon className="size-4 text-primary" />{plan.maxUsers} users</li>
                  <li className="flex items-center gap-2"><CheckIcon className="size-4 text-primary" />{plan.maxTerminals} terminals</li>
                </ul>
              </CardContent>
              <CardFooter className="flex gap-2">
                {isCurrent ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">Current Plan</Badge>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => handleChangePlan(plan.id)}>Switch</Button>
                    <Button className="flex-1" onClick={() => handleCheckout(plan.id)}>Pay</Button>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
