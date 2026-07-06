import { useEffect, useState } from 'react';
import { api, type OrganizationDto } from '@pos/api-client';
import { useAuth } from '@/auth';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function SettingsPage() {
  const { isOrgAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', defaultTaxRate: '0.08', currency: 'USD',
    receiptHeader: '', receiptFooter: '', paymentQrPayload: '', paymentInstructions: '',
  });

  useEffect(() => {
    if (!isOrgAdmin) { setLoading(false); return; }
    api.getOrganization().then((org) => {
      setForm({
        name: org.name,
        defaultTaxRate: String(org.defaultTaxRate),
        currency: org.currency,
        receiptHeader: org.receiptHeader ?? '',
        receiptFooter: org.receiptFooter ?? '',
        paymentQrPayload: org.paymentQrPayload ?? '',
        paymentInstructions: org.paymentInstructions ?? '',
      });
      setLoading(false);
    });
  }, [isOrgAdmin]);

  const handleSave = async () => {
    try {
      await api.updateOrganization({
        name: form.name,
        defaultTaxRate: parseFloat(form.defaultTaxRate),
        currency: form.currency,
        receiptHeader: form.receiptHeader || undefined,
        receiptFooter: form.receiptFooter || undefined,
        paymentQrPayload: form.paymentQrPayload || undefined,
        paymentInstructions: form.paymentInstructions || undefined,
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  if (!isOrgAdmin) {
    return (
      <div>
        <PageHeader title="Settings" />
        <p className="text-muted-foreground">Org admin access required.</p>
      </div>
    );
  }

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Organization Settings" description="Tax, currency, and receipt branding" />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2"><Label>Organization Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2"><Label>Default Tax Rate</Label><Input type="number" step="0.01" value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          </div>
          <div className="flex flex-col gap-2"><Label>Receipt Header</Label><Input value={form.receiptHeader} onChange={(e) => setForm({ ...form, receiptHeader: e.target.value })} /></div>
          <div className="flex flex-col gap-2"><Label>Receipt Footer</Label><Input value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} /></div>
          <div className="flex flex-col gap-2"><Label>Payment QR Payload</Label><Input value={form.paymentQrPayload} onChange={(e) => setForm({ ...form, paymentQrPayload: e.target.value })} placeholder="Bank account / PromptPay / payment URL encoded in QR" /></div>
          <div className="flex flex-col gap-2"><Label>Payment Instructions</Label><Input value={form.paymentInstructions} onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })} placeholder="Shown on receipt for bank transfers" /></div>
          <Button onClick={handleSave} className="w-fit">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
