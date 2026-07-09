import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2Icon,
  CreditCardIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { api, ApiError, type PlatformReportsDto, type SubscriptionPaymentDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{title}</CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
}

export function PlatformReportsPage() {
  const [data, setData] = useState<PlatformReportsDto | null>(null);
  const [allPayments, setAllPayments] = useState<SubscriptionPaymentDto[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [reports, payments] = await Promise.all([
        api.getPlatformReports(),
        api.getSubscriptionPayments(),
      ]);
      setData(reports);
      setAllPayments(payments);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = useMemo(
    () => (paymentFilter === 'All' ? allPayments : allPayments.filter((p) => p.status === paymentFilter)),
    [allPayments, paymentFilter],
  );

  useEffect(() => { load(); }, []);

  const verifyPayment = async (id: string, approve: boolean) => {
    try {
      await api.verifySubscriptionPayment(id, approve);
      toast.success(approve ? 'Payment verified' : 'Payment rejected');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to verify payment');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="Platform Reports" />
        <p className="text-muted-foreground">Reports unavailable.</p>
      </div>
    );
  }

  const { revenue, tenantSales } = data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="SaaS Revenue & Sales"
        description="Subscription revenue from verified payments and aggregate POS sales across all tenant stores"
        action={<Button variant="outline" onClick={load}>Refresh</Button>}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Subscription revenue</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Today" value={formatCurrency(revenue.todayRevenue)} icon={DollarSignIcon} />
          <StatCard title="This month" value={formatCurrency(revenue.monthRevenue)} icon={TrendingUpIcon} />
          <StatCard title="This year" value={formatCurrency(revenue.yearRevenue)} icon={CreditCardIcon} />
          <StatCard
            title="All time"
            value={formatCurrency(revenue.allTimeRevenue)}
            subtitle={`${revenue.verifiedPaymentCount} verified payments`}
            icon={DollarSignIcon}
          />
        </div>
        {revenue.pendingPaymentCount > 0 && (
          <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">Pending subscription payments</p>
                <p className="text-sm text-muted-foreground">
                  {revenue.pendingPaymentCount} awaiting review · {formatCurrency(revenue.pendingRevenue)}
                </p>
              </div>
              <Badge variant="secondary">Review below</Badge>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Tenant POS sales (platform-wide)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today"
            value={formatCurrency(tenantSales.todaySales)}
            subtitle={`${tenantSales.todayOrders} orders`}
            icon={ShoppingCartIcon}
          />
          <StatCard
            title="This week"
            value={formatCurrency(tenantSales.weekSales)}
            subtitle={`${tenantSales.weekOrders} orders`}
            icon={ShoppingCartIcon}
          />
          <StatCard
            title="This month"
            value={formatCurrency(tenantSales.monthSales)}
            subtitle={`${tenantSales.monthOrders} orders`}
            icon={ShoppingCartIcon}
          />
          <StatCard
            title="This year"
            value={formatCurrency(tenantSales.yearSales)}
            subtitle={`${tenantSales.yearOrders} orders`}
            icon={Building2Icon}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by plan</CardTitle>
            <CardDescription>Verified subscription payments and active subscribers</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Plan</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Subscribers</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Payments</th>
                  <th className="pb-2 font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.revenueByPlan.map((row) => (
                  <tr key={row.planId}>
                    <td className="py-2.5 pr-4 font-medium">{row.planName}</td>
                    <td className="py-2.5 pr-4">{row.subscriberCount}</td>
                    <td className="py-2.5 pr-4">{row.paymentCount}</td>
                    <td className="py-2.5">{formatCurrency(row.verifiedRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top stores this month</CardTitle>
            <CardDescription>POS sales by tenant organization</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Store</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Plan</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Orders</th>
                  <th className="pb-2 font-medium text-muted-foreground">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.salesByOrganization.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-muted-foreground">No sales this month yet</td></tr>
                ) : (
                  data.salesByOrganization.map((row) => (
                    <tr key={row.organizationId}>
                      <td className="py-2.5 pr-4 font-medium">{row.organizationName}</td>
                      <td className="py-2.5 pr-4">{row.planName}</td>
                      <td className="py-2.5 pr-4">{row.orderCount}</td>
                      <td className="py-2.5">{formatCurrency(row.totalSales)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>12-month trend</CardTitle>
          <CardDescription>Subscription revenue vs tenant POS sales</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Month</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Subscription</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Tenant sales</th>
                <th className="pb-2 font-medium text-muted-foreground">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.monthlyTrend.map((row) => (
                <tr key={`${row.year}-${row.month}`}>
                  <td className="py-2.5 pr-4">{monthLabel(row.year, row.month)}</td>
                  <td className="py-2.5 pr-4">{formatCurrency(row.subscriptionRevenue)}</td>
                  <td className="py-2.5 pr-4">{formatCurrency(row.tenantSales)}</td>
                  <td className="py-2.5">{row.tenantOrderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Subscription payments</CardTitle>
              <CardDescription>Verify bank transfers and cash payments from stores</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Pending', 'Verified', 'Rejected'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={paymentFilter === f ? 'default' : 'outline'}
                  onClick={() => setPaymentFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Store</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Plan</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Amount</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Period</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                <th className="pb-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-muted-foreground">No payments</td></tr>
              ) : filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-4">
                    <Link to="/tenants" className="font-medium hover:underline">{p.organizationName}</Link>
                  </td>
                  <td className="py-2.5 pr-4">{p.planName}</td>
                  <td className="py-2.5 pr-4">{formatCurrency(p.amount)}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant={p.status === 'Verified' ? 'default' : p.status === 'Pending' ? 'secondary' : 'outline'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-2.5">
                    {p.status === 'Pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => verifyPayment(p.id, true)}>Verify</Button>
                        <Button size="sm" variant="outline" onClick={() => verifyPayment(p.id, false)}>Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
