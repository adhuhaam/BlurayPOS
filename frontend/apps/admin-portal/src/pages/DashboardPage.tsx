import { useEffect, useState } from 'react';
import { DollarSignIcon, ShoppingCartIcon, TrendingUpIcon, StoreIcon } from 'lucide-react';
import { api, type DashboardReportDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

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
  const [data, setData] = useState<DashboardReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
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

  if (!data) {
    return <p className="text-muted-foreground">Failed to load dashboard</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Sales overview across all stores" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Sales" value={formatCurrency(data.todaySales)} subtitle={`${data.todayOrders} orders`} icon={DollarSignIcon} />
        <StatCard title="Today's Orders" value={String(data.todayOrders)} subtitle="Completed today" icon={ShoppingCartIcon} />
        <StatCard title="Week Sales" value={formatCurrency(data.weekSales)} subtitle={`${data.weekOrders} orders`} icon={TrendingUpIcon} />
        <StatCard title="Active Stores" value={String(data.storeSales.length)} subtitle="Reporting stores" icon={StoreIcon} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best sellers by revenue</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales data yet</p>
            ) : (
              data.topProducts.map((p, i) => (
                <div key={p.productId}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{i + 1}</Badge>
                      <span className="font-medium">{p.productName}</span>
                    </div>
                    <span className="text-muted-foreground">{formatCurrency(p.revenue)}</span>
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
            <CardTitle>Store Performance</CardTitle>
            <CardDescription>Sales breakdown by location</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.storeSales.map((s, i) => (
              <div key={s.storeId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.storeName}</span>
                  <span className="font-semibold">{formatCurrency(s.totalSales)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.orderCount} orders</p>
                {i < data.storeSales.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
