import { useEffect, useState } from 'react';
import { Building2Icon, CreditCardIcon, DollarSignIcon, ShoppingCartIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

export function PlatformDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    platformName: 'BlurayPOS',
    organizationCount: 0,
    userCount: 0,
    pendingPaymentCount: 0,
    monthRevenue: 0,
    monthTenantSales: 0,
    monthTenantOrders: 0,
  });

  useEffect(() => {
    Promise.all([api.getPlatformSettings(), api.getPlatformReports()])
      .then(([settings, reports]) => setStats({
        platformName: settings.platformName,
        organizationCount: settings.organizationCount,
        userCount: settings.userCount,
        pendingPaymentCount: settings.pendingPaymentCount,
        monthRevenue: reports.revenue.monthRevenue,
        monthTenantSales: reports.tenantSales.monthSales,
        monthTenantOrders: reports.tenantSales.monthOrders,
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={stats.platformName}
        description="Platform owner console — subscription revenue, tenant sales, plans, and stores"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscription revenue (month)</CardTitle>
            <DollarSignIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthRevenue)}</div>
            <p className="text-xs text-muted-foreground">Verified SaaS payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tenant POS sales (month)</CardTitle>
            <ShoppingCartIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthTenantSales)}</div>
            <p className="text-xs text-muted-foreground">{stats.monthTenantOrders} orders platform-wide</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending payments</CardTitle>
            <CreditCardIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.pendingPaymentCount}</span>
              {stats.pendingPaymentCount > 0 && <Badge variant="secondary">Review</Badge>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stores (tenants)</CardTitle>
            <Building2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizationCount}</div>
            <p className="text-xs text-muted-foreground">Registered businesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tenant users</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">Across all stores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUpIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizationCount}</div>
            <p className="text-xs text-muted-foreground">Active tenant organizations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Platform administration — plans, revenue, and tenant management</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/reports"><Button>Revenue & sales reports</Button></Link>
          <Link to="/plans"><Button variant="outline">Manage plans</Button></Link>
          <Link to="/tenants"><Button variant="outline">Manage stores</Button></Link>
          <Link to="/platform-settings"><Button variant="outline">Platform settings</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
