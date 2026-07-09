import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TicketIcon } from 'lucide-react';
import { api, type CouponCampaignDto, type CouponDashboardDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CouponsDashboardPage() {
  const [dashboard, setDashboard] = useState<CouponDashboardDto | null>(null);
  const [campaigns, setCampaigns] = useState<CouponCampaignDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCouponDashboard(), api.getCouponCampaigns()])
      .then(([dash, list]) => {
        setDashboard(dash);
        setCampaigns(list.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64 w-full" />;

  const stats = [
    { label: 'Campaigns', value: dashboard?.totalCampaigns ?? 0 },
    { label: 'Active', value: dashboard?.activeCampaigns ?? 0 },
    { label: 'QR codes', value: dashboard?.totalCodes ?? 0 },
    { label: 'Entries', value: dashboard?.totalEntries ?? 0 },
    { label: 'Scans today', value: dashboard?.todayScans ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title="Coupons & Lucky Draw"
        description="Create campaigns, print QR stickers, track entries."
        actions={
          <Button render={<Link to="/coupons/new" />}>
            <PlusIcon data-icon="inline-start" />
            New campaign
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TicketIcon className="size-5" /> Campaigns</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Codes</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No campaigns yet.</TableCell></TableRow>
              ) : campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.campaignType}</TableCell>
                  <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                  <TableCell>{c.totalCodes}</TableCell>
                  <TableCell>{c.totalEntries}</TableCell>
                  <TableCell><Link to={`/coupons/${c.id}`} className="text-primary text-sm font-medium">Manage →</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
