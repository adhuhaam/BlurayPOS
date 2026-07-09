import { useEffect, useState } from 'react';
import { CreditCardIcon, CheckIcon, UploadIcon, AlertTriangleIcon } from 'lucide-react';
import {
  api,
  ApiError,
  type PlanDto,
  type SubscriptionBillingInfoDto,
  type SubscriptionPaymentDto,
} from '@pos/api-client';
import { useAuth } from '@/auth';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/form-select';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const isDev = import.meta.env.DEV;

function UsageBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function formatPlanPrice(yearly: number): string {
  if (yearly === 0) return 'Free';
  return `${formatCurrency(yearly)}/yr`;
}

function formatPlanPriceSub(yearly: number): string {
  if (yearly === 0) return 'Forever free';
  return `≈ ${formatCurrency(Math.round(yearly / 12))}/month · billed yearly`;
}

function StatusBanner({ subscription }: { subscription: NonNullable<ReturnType<typeof useAuth>['subscription']> }) {
  if (subscription.isReadOnly) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertTriangleIcon className="mt-0.5 size-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Subscription expired</p>
            <p className="text-sm text-muted-foreground">
              Your store is read-only. Submit renewal payment below — full access returns after Super Admin verification.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscription.renewalDue) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertTriangleIcon className="mt-0.5 size-5 text-amber-600" />
          <div>
            <p className="font-medium">Renewal due in {subscription.daysRemaining} day{subscription.daysRemaining === 1 ? '' : 's'}</p>
            <p className="text-sm text-muted-foreground">
              Period ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. Renew early to avoid read-only mode.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export function BillingPage() {
  const { subscription, refreshProfile, isOrgAdmin } = useAuth();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [billingInfo, setBillingInfo] = useState<SubscriptionBillingInfoDto | null>(null);
  const [payments, setPayments] = useState<SubscriptionPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewMethod, setRenewMethod] = useState('BankTransfer');
  const [renewAmount, setRenewAmount] = useState('');
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [planList, info, paymentList] = await Promise.all([
        api.getPlans(),
        api.getSubscriptionBillingInfo(),
        api.getMySubscriptionPayments(),
      ]);
      setPlans(planList);
      setBillingInfo(info);
      setPayments(paymentList);
      if (!renewPlanId && subscription?.planId) setRenewPlanId(subscription.planId);
    } catch {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!renewPlanId && subscription?.planId) setRenewPlanId(subscription.planId);
    const plan = plans.find((p) => p.id === (renewPlanId || subscription?.planId));
    if (plan) setRenewAmount(String(plan.priceYearly));
  }, [subscription, plans, renewPlanId]);

  const handleChangePlan = async (planId: string) => {
    try {
      await api.changePlan({ planId });
      await refreshProfile();
      await load();
      toast.success('Plan updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to change plan');
    }
  };

  const handleProofUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadFile(file);
      setProofPath(result.path);
      toast.success('Proof uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitRenewal = async () => {
    if (!renewPlanId) return;
    setSubmitting(true);
    try {
      await api.submitSubscriptionPayment({
        planId: renewPlanId,
        amount: Number(renewAmount),
        method: renewMethod,
        proofImagePath: proofPath ?? undefined,
      });
      setProofPath(null);
      await load();
      toast.success('Renewal payment submitted — awaiting verification');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  const showRenewalCard = subscription && (subscription.renewalDue || subscription.isReadOnly || subscription.planSlug !== 'free');

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
        <>
          <StatusBanner subscription={subscription} />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCardIcon className="size-5" />
                    {subscription.planName} Plan
                  </CardTitle>
                  <CardDescription>
                    {formatPlanPrice(subscription.priceYearly)} · {subscription.status}
                    {subscription.daysRemaining > 0 && ` · ${subscription.daysRemaining} days left`}
                  </CardDescription>
                </div>
                <Badge variant={subscription.isReadOnly ? 'destructive' : 'secondary'}>{subscription.status}</Badge>
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

          {showRenewalCard && billingInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Renew subscription</CardTitle>
                <CardDescription>Yearly billing — bank transfer or cash. Upload proof after payment.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {(billingInfo.billingBankName || billingInfo.billingBankAccount) && (
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <p className="font-medium">Bank details</p>
                    {billingInfo.billingBankName && <p>Bank: {billingInfo.billingBankName}</p>}
                    {billingInfo.billingBankAccount && <p>Account: {billingInfo.billingBankAccount}</p>}
                    {billingInfo.billingBankInstructions && (
                      <p className="mt-2 text-muted-foreground">{billingInfo.billingBankInstructions}</p>
                    )}
                    {billingInfo.billingContactEmail && (
                      <p className="mt-2">Contact: {billingInfo.billingContactEmail}</p>
                    )}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Plan</Label>
                    <FormSelect
                      value={renewPlanId}
                      onValueChange={setRenewPlanId}
                      options={plans.filter((p) => p.priceYearly > 0).map((p) => ({ value: p.id, label: `${p.name} (${formatPlanPrice(p.priceYearly)})` }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Payment method</Label>
                    <FormSelect
                      value={renewMethod}
                      onValueChange={setRenewMethod}
                      options={[
                        { value: 'BankTransfer', label: 'Bank transfer' },
                        { value: 'Cash', label: 'Cash' },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Amount (MVR)</Label>
                    <Input type="number" value={renewAmount} onChange={(e) => setRenewAmount(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Proof of payment</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={uploading}
                      onChange={(e) => handleProofUpload(e.target.files?.[0] ?? null)}
                    />
                    {proofPath && <p className="text-xs text-muted-foreground">Uploaded: {proofPath}</p>}
                  </div>
                </div>
                <Button onClick={handleSubmitRenewal} disabled={submitting || !renewPlanId}>
                  <UploadIcon data-icon="inline-start" />
                  {submitting ? 'Submitting…' : 'Submit renewal payment'}
                </Button>
              </CardContent>
            </Card>
          )}

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment history</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Plan</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Amount</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Period</th>
                      <th className="pb-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 pr-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 pr-4">{p.planName}</td>
                        <td className="py-2.5 pr-4">{formatCurrency(p.amount)}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="py-2.5">
                          <Badge variant={p.status === 'Verified' ? 'default' : p.status === 'Pending' ? 'secondary' : 'outline'}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">No active subscription.</p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.planId === plan.id;
          const isFree = plan.priceYearly === 0;
          const canInstantSwitch = isDev || isFree;
          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">{formatPlanPrice(plan.priceYearly)}</div>
                <p className="text-sm text-muted-foreground">{formatPlanPriceSub(plan.priceYearly)}</p>
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
                ) : canInstantSwitch ? (
                  <Button variant="outline" className="w-full" onClick={() => handleChangePlan(plan.id)}>
                    {isFree ? 'Switch to Free' : 'Switch (dev)'}
                  </Button>
                ) : (
                  <p className="w-full text-center text-xs text-muted-foreground">Use renewal form above</p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
