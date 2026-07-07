import { useEffect, useState } from 'react';
import { Building2Icon, CreditCardIcon, UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function PlatformDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    platformName: 'BlurayPOS',
    organizationCount: 0,
    userCount: 0,
    pendingPaymentCount: 0,
  });

  useEffect(() => {
    api.getPlatformSettings()
      .then((s) => setStats({
        platformName: s.platformName,
        organizationCount: s.organizationCount,
        userCount: s.userCount,
        pendingPaymentCount: s.pendingPaymentCount,
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={stats.platformName}
        description="Platform owner console — manage subscription plans and tenant stores"
      />

      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Per BlurayPOS SaaS architecture — platform administration only</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/plans"><Button>Manage plans</Button></Link>
          <Link to="/tenants"><Button variant="outline">Manage stores</Button></Link>
          <Link to="/platform-settings"><Button variant="outline">Platform settings</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
