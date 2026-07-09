import { useEffect, useState } from 'react';
import { ExternalLinkIcon, PlusIcon, PrinterIcon } from 'lucide-react';
import { api, type DiningTableDto, type OrganizationDto, type StoreDto } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSelect } from '@/components/form-select';
import { toast } from 'sonner';
import { menuUrlForSlug, orderUrlForSlug } from '@/config';

type TabId = 'preview' | 'tables' | 'print';

function menuUrl(slug: string, qrToken?: string) {
  return qrToken ? `${menuUrlForSlug(slug)}/t/${qrToken}` : menuUrlForSlug(slug);
}

export function OnlineMenuPage() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [tab, setTab] = useState<TabId>('preview');

  useEffect(() => {
    Promise.all([api.getStores(), api.getOrganization()]).then(([s, o]) => {
      setStores(s);
      setOrg(o);
      if (s[0]) setStoreId(s[0].id);
    });
  }, []);

  useEffect(() => {
    if (!storeId) return;
    api.getDiningTables(storeId).then(setTables).catch(() => setTables([]));
  }, [storeId]);

  const slug = org?.slug ?? 'your-store';

  const addTable = async () => {
    if (!newTableName.trim()) return;
    try {
      await api.createDiningTable(storeId, { name: newTableName.trim(), capacity: 4 });
      setNewTableName('');
      const list = await api.getDiningTables(storeId);
      setTables(list);
      toast.success('Table added');
    } catch {
      toast.error('Failed to add table');
    }
  };

  const printQr = (url: string, title: string) => {
    const w = window.open('', '_blank', 'width=400,height=520');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>body{font-family:system-ui;text-align:center;padding:24px}h1{font-size:18px}p{font-size:13px;color:#555}
      img{margin:16px auto;display:block}</style></head><body>
      <h1>${org?.name ?? 'Menu'}</h1><p>${title}</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" width="200" height="200" alt="QR" />
      <p>Scan to view menu & order</p><p style="font-size:11px">${url}</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="flex flex-col gap-6">
      <ModulePageHeader
        title="Online Menu"
        description="Preview your menu, manage tables, and print QR cards for dine-in"
      />

      <div className="max-w-xs">
        <Label>Branch</Label>
        <FormSelect
          value={storeId}
          onChange={setStoreId}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(['preview', 'tables', 'print'] as TabId[]).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'ghost'} onClick={() => setTab(t)}>
            {t === 'preview' ? 'Preview' : t === 'tables' ? 'Tables & QR' : 'Print materials'}
          </Button>
        ))}
      </div>

      {tab === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer view</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto w-[320px] overflow-hidden rounded-2xl border bg-background shadow-lg">
                <iframe
                  title="Menu preview"
                  src={menuUrl(slug)}
                  className="h-[560px] w-full border-0"
                />
              </div>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => window.open(menuUrl(slug), '_blank')}>
                <ExternalLinkIcon data-icon="inline-start" /> Open menu
              </Button>
            </CardContent>
          </Card>
      )}

      {tab === 'tables' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Add table</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Input placeholder="Table name" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} className="max-w-xs" />
              <Button onClick={addTable}><PlusIcon data-icon="inline-start" /> Add</Button>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex flex-col gap-2 pt-4">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{menuUrl(slug, t.qrToken ?? undefined)}</p>
                  <Button size="sm" variant="secondary" onClick={() => printQr(menuUrl(slug, t.qrToken ?? undefined), t.name)}>
                    <PrinterIcon data-icon="inline-start" /> Print QR
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'print' && (
        <div className="flex flex-col gap-4 max-w-md">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <p className="text-sm text-muted-foreground">Menu poster for counter or entrance</p>
              <Button onClick={() => printQr(menuUrl(slug), 'Scan for our menu')}>
                <PrinterIcon data-icon="inline-start" /> Print menu QR poster
              </Button>
              <Button variant="outline" onClick={() => printQr(orderUrlForSlug(slug), 'Order for pickup or delivery')}>
                <PrinterIcon data-icon="inline-start" /> Print order QR poster
              </Button>
              {tables.length > 0 && (
                <Button variant="secondary" onClick={() => tables.forEach((t) => printQr(menuUrl(slug, t.qrToken ?? undefined), t.name))}>
                  <PrinterIcon data-icon="inline-start" /> Print all table QR cards
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
