import { useEffect, useState } from 'react';
import { Building2Icon, UsersIcon, CreditCardIcon, MegaphoneIcon } from 'lucide-react';
import { api, type PlatformSettingsDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type FormState = Omit<PlatformSettingsDto, 'organizationCount' | 'userCount' | 'pendingPaymentCount'>;

function ToggleField({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
      <input
        type="checkbox"
        className="mt-1 size-4 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ organizationCount: 0, userCount: 0, pendingPaymentCount: 0 });
  const [form, setForm] = useState<FormState>({
    platformName: '',
    platformTagline: '',
    supportEmail: '',
    defaultCurrency: 'MVR',
    defaultTimezone: 'Indian/Maldives',
    allowSelfRegistration: true,
    maintenanceMode: false,
    maintenanceMessage: '',
    billingBankName: '',
    billingBankAccount: '',
    billingBankInstructions: '',
    billingContactEmail: '',
    announcementTitle: '',
    announcementBody: '',
    announcementActive: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPlatformSettings();
      setForm({
        platformName: data.platformName,
        platformTagline: data.platformTagline,
        supportEmail: data.supportEmail,
        defaultCurrency: data.defaultCurrency,
        defaultTimezone: data.defaultTimezone,
        allowSelfRegistration: data.allowSelfRegistration,
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage ?? '',
        billingBankName: data.billingBankName,
        billingBankAccount: data.billingBankAccount,
        billingBankInstructions: data.billingBankInstructions,
        billingContactEmail: data.billingContactEmail,
        announcementTitle: data.announcementTitle ?? '',
        announcementBody: data.announcementBody ?? '',
        announcementActive: data.announcementActive,
      });
      setStats({
        organizationCount: data.organizationCount,
        userCount: data.userCount,
        pendingPaymentCount: data.pendingPaymentCount,
      });
    } catch {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updatePlatformSettings({
        platformName: form.platformName,
        platformTagline: form.platformTagline,
        supportEmail: form.supportEmail,
        defaultCurrency: form.defaultCurrency,
        defaultTimezone: form.defaultTimezone,
        allowSelfRegistration: form.allowSelfRegistration,
        maintenanceMode: form.maintenanceMode,
        maintenanceMessage: form.maintenanceMessage || undefined,
        billingBankName: form.billingBankName,
        billingBankAccount: form.billingBankAccount,
        billingBankInstructions: form.billingBankInstructions,
        billingContactEmail: form.billingContactEmail,
        announcementTitle: form.announcementTitle || undefined,
        announcementBody: form.announcementBody || undefined,
        announcementActive: form.announcementActive,
      });
      setStats({
        organizationCount: updated.organizationCount,
        userCount: updated.userCount,
        pendingPaymentCount: updated.pendingPaymentCount,
      });
      toast.success('Platform settings saved');
    } catch {
      toast.error('Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform Settings"
        description="Global BlurayPOS configuration — branding, registration, billing, and announcements"
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.organizationCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tenant Users</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.userCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCardIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.pendingPaymentCount}</span>
              {stats.pendingPaymentCount > 0 && <Badge variant="secondary">Needs review</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>How the platform appears to store owners</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Platform name</Label>
              <Input value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tagline</Label>
              <Input value={form.platformTagline} onChange={(e) => setForm({ ...form, platformTagline: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Support email</Label>
              <Input type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New store defaults</CardTitle>
            <CardDescription>Applied when provisioning or self-registering tenants</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Default currency</Label>
                <Input value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Default timezone</Label>
                <Input value={form.defaultTimezone} onChange={(e) => setForm({ ...form, defaultTimezone: e.target.value })} />
              </div>
            </div>
            <ToggleField
              label="Allow self-registration"
              description="Public /register page creates new tenants on the Free plan"
              checked={form.allowSelfRegistration}
              onChange={(v) => setForm({ ...form, allowSelfRegistration: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <CardDescription>Temporarily restrict tenant access during upgrades</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ToggleField
              label="Maintenance mode"
              description="Blocks tenant logins (Super Admin unaffected)"
              checked={form.maintenanceMode}
              onChange={(v) => setForm({ ...form, maintenanceMode: v })}
            />
            <div className="flex flex-col gap-2">
              <Label>Maintenance message</Label>
              <textarea
                className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={form.maintenanceMessage ?? ''}
                onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
                placeholder="We are performing scheduled maintenance..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription billing</CardTitle>
            <CardDescription>Bank transfer details shown to tenants for yearly renewals</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Bank name</Label>
              <Input value={form.billingBankName} onChange={(e) => setForm({ ...form, billingBankName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Account number / IBAN</Label>
              <Input value={form.billingBankAccount} onChange={(e) => setForm({ ...form, billingBankAccount: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Payment instructions</Label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={form.billingBankInstructions}
                onChange={(e) => setForm({ ...form, billingBankInstructions: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Billing contact email</Label>
              <Input type="email" value={form.billingContactEmail} onChange={(e) => setForm({ ...form, billingContactEmail: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Platform announcement</CardTitle>
                <CardDescription>Broadcast a message to all store dashboards (future: in-app banner)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ToggleField
              label="Publish announcement"
              checked={form.announcementActive}
              onChange={(v) => setForm({ ...form, announcementActive: v })}
            />
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input value={form.announcementTitle ?? ''} onChange={(e) => setForm({ ...form, announcementTitle: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Message</Label>
              <textarea
                className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={form.announcementBody ?? ''}
                onChange={(e) => setForm({ ...form, announcementBody: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
