import { useEffect, useState } from 'react';
import { api, type StoreDto } from '@pos/api-client';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSelect } from '@/components/form-select';
import { toast } from 'sonner';
import { menuUrlForSlug, orderUrlForSlug } from '@/config';

export function OnlineOrderingSettingsCard() {
  const { tenantFeatures, isOrgAdmin } = useAuth();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [orgSlug, setOrgSlug] = useState('your-store');
  const [form, setForm] = useState({
    onlineMenuEnabled: false,
    onlineOrderingEnabled: false,
    allowPickup: true,
    allowDelivery: false,
    allowDineIn: true,
    allowCashOnDelivery: true,
    allowBankTransfer: true,
    minOrderAmount: '0',
    deliveryFeeFlat: '0',
    onlineMenuWelcomeText: '',
  });

  useEffect(() => {
    Promise.all([api.getStores(), api.getOrganization()])
      .then(([s, org]) => {
        setStores(s);
        setOrgSlug(org.slug);
        if (s[0]) setStoreId(s[0].id);
      });
  }, []);

  useEffect(() => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;
    setForm({
      onlineMenuEnabled: store.onlineMenuEnabled ?? false,
      onlineOrderingEnabled: store.onlineOrderingEnabled ?? false,
      allowPickup: store.allowPickup ?? true,
      allowDelivery: store.allowDelivery ?? false,
      allowDineIn: store.allowDineIn ?? true,
      allowCashOnDelivery: store.allowCashOnDelivery ?? true,
      allowBankTransfer: store.allowBankTransfer ?? true,
      minOrderAmount: String(store.minOrderAmount ?? 0),
      deliveryFeeFlat: String(store.deliveryFeeFlat ?? 0),
      onlineMenuWelcomeText: store.onlineMenuWelcomeText ?? '',
    });
  }, [storeId, stores]);

  const save = async () => {
    try {
      const store = stores.find((s) => s.id === storeId);
      if (!store) return;
      await api.updateStore(storeId, {
        name: store.name,
        address: store.address ?? undefined,
        phone: store.phone ?? undefined,
        isActive: store.isActive,
        ...form,
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        deliveryFeeFlat: parseFloat(form.deliveryFeeFlat) || 0,
      });
      const updated = await api.getStores();
      setStores(updated);
      toast.success('Online ordering settings saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Online ordering</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Label>Branch</Label>
          <FormSelect value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        </div>
        {tenantFeatures?.onlineMenu && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.onlineMenuEnabled} onChange={(e) => setForm({ ...form, onlineMenuEnabled: e.target.checked })} />
            Enable online menu (menu.bluraymaldives.site)
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.onlineOrderingEnabled} onChange={(e) => setForm({ ...form, onlineOrderingEnabled: e.target.checked })} />
          Enable online ordering (order.bluraymaldives.site)
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowPickup} onChange={(e) => setForm({ ...form, allowPickup: e.target.checked })} /> Pickup</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowDelivery} onChange={(e) => setForm({ ...form, allowDelivery: e.target.checked })} /> Delivery</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowDineIn} onChange={(e) => setForm({ ...form, allowDineIn: e.target.checked })} /> Dine-in</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowCashOnDelivery} onChange={(e) => setForm({ ...form, allowCashOnDelivery: e.target.checked })} /> Cash on delivery</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowBankTransfer} onChange={(e) => setForm({ ...form, allowBankTransfer: e.target.checked })} /> Bank transfer</label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div><Label>Min order (MVR)</Label><Input value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} /></div>
          <div><Label>Delivery fee (MVR)</Label><Input value={form.deliveryFeeFlat} onChange={(e) => setForm({ ...form, deliveryFeeFlat: e.target.value })} /></div>
        </div>
        <div><Label>Welcome text</Label><Input value={form.onlineMenuWelcomeText} onChange={(e) => setForm({ ...form, onlineMenuWelcomeText: e.target.value })} /></div>
        <p className="text-xs text-muted-foreground">
          Menu: {menuUrlForSlug(orgSlug)} · Order: {orderUrlForSlug(orgSlug)}
        </p>
        <Button onClick={save} disabled={!isOrgAdmin}>
          {isOrgAdmin ? 'Save online settings' : 'Org admin required to save'}
        </Button>
      </CardContent>
    </Card>
  );
}
