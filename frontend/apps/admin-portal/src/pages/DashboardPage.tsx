import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CreditCardIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingCartIcon,
  StoreIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import { api, type DashboardReportDto, type StoreDto } from '@pos/api-client';
import { useAuth } from '@/auth';
import { links } from '@/config';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { FormSelect } from '@/components/form-select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{title}</CardDescription>
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user, subscription, isOrgAdmin, isStoreManager, roles } = useAuth();
  const [data, setData] = useState<DashboardReportDto | null>(null);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [currency, setCurrency] = useState('MVR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const roleLabel = roles.includes('OrgAdmin')
    ? 'Manager'
    : roles.includes('StoreManager')
      ? 'Branch Manager'
      : 'Team member';

  const loadDashboard = async (branchId?: string) => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, org] = await Promise.all([
        api.getDashboard(branchId || undefined),
        api.getOrganization(),
      ]);
      setData(dashboard);
      setCurrency(org.currency || 'MVR');
    } catch {
      setError('Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getStores().then((list) => {
      setStores(list);
      const preferred = user?.defaultStoreId && list.some((s) => s.id === user.defaultStoreId)
        ? user.defaultStoreId
        : list[0]?.id ?? '';
      setStoreId(preferred);
    });
  }, [user?.defaultStoreId]);

  useEffect(() => {
    if (!storeId && stores.length === 0) {
      loadDashboard();
      return;
    }
    if (storeId) loadDashboard(storeId);
  }, [storeId, stores.length]);

  const fmt = (n: number) => formatCurrency(n, currency);

  const maxStoreSales = useMemo(
    () => Math.max(...(data?.storeSales.map((s) => s.totalSales) ?? [0]), 1),
    [data?.storeSales],
  );

  const quickActions = [
    { to: '/orders', label: 'Orders', icon: ShoppingCartIcon, show: true },
    { to: '/products', label: 'Products', icon: PackageIcon, show: isOrgAdmin || isStoreManager },
    { to: '/users', label: 'Users', icon: UsersIcon, show: isOrgAdmin },
    { to: '/billing', label: 'Billing', icon: CreditCardIcon, show: isOrgAdmin },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, show: isOrgAdmin },
  ].filter((a) => a.show);

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Dashboard" />
        <Alert variant="destructive">
          <AlertDescription>{error || 'Failed to load dashboard'}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => loadDashboard(storeId || undefined)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${user?.firstName ?? 'there'}`}
        description={`${roleLabel} overview${storeId ? ` · ${stores.find((s) => s.id === storeId)?.name ?? 'Branch'}` : ''}`}
        action={
          <Button variant="outline" asChild>
            <a href={links.pos} target="_blank" rel="noreferrer">
              <ExternalLinkIcon data-icon="inline-start" />
              Open POS
            </a>
          </Button>
        }
      />

      {subscription && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {subscription.planName} plan
                <Badge variant="secondary" className="ml-2">{subscription.status}</Badge>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {subscription.storeCount} branch(es) · {subscription.userCount} user(s)
                {isOrgAdmin && (
                  <>
                    {' '}
                    · up to {subscription.maxProducts >= 100000 ? 'unlimited' : subscription.maxProducts} products
                  </>
                )}
              </p>
            </div>
            {isOrgAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/billing">
                  Manage billing
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {stores.length > 1 && (
        <FormSelect
          label="Branch"
          value={storeId}
          onValueChange={setStoreId}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
          className="max-w-xs"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Sales" value={fmt(data.todaySales)} subtitle={`${data.todayOrders} orders`} icon={DollarSignIcon} />
        <StatCard title="Today's Orders" value={String(data.todayOrders)} subtitle="Completed today" icon={ShoppingCartIcon} />
        <StatCard title="Week Sales" value={fmt(data.weekSales)} subtitle={`${data.weekOrders} orders`} icon={TrendingUpIcon} />
        <StatCard title="Branches" value={String(data.storeSales.length)} subtitle="With sales data" icon={StoreIcon} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button key={action.to} variant="outline" className="h-auto justify-start gap-2 py-3" asChild>
              <Link to={action.to}>
                <Icon className="size-4 shrink-0" />
                {action.label}
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best sellers by revenue</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.topProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                No sales yet.{' '}
                <Link to="/products" className="text-primary underline-offset-4 hover:underline">
                  Add products
                </Link>{' '}
                or open POS to take your first order.
              </div>
            ) : (
              data.topProducts.map((p, i) => (
                <div key={p.productId}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{i + 1}</Badge>
                      <span className="font-medium">{p.productName}</span>
                    </div>
                    <span className="text-muted-foreground">{fmt(p.revenue)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.quantitySold} units sold</p>
                  {i < data.topProducts.length - 1 && <Separator className="mt-3" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch Performance</CardTitle>
            <CardDescription>Sales breakdown by location</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.storeSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No branch sales data yet</p>
            ) : (
              data.storeSales.map((s) => (
                <div key={s.storeId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.storeName}</span>
                    <span className="font-semibold">{fmt(s.totalSales)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(4, (s.totalSales / maxStoreSales) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.orderCount} orders</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
