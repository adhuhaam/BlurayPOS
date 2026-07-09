import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CopyIcon, DownloadIcon, ExternalLinkIcon, PrinterIcon, TrophyIcon, XCircleIcon,
} from 'lucide-react';
import {
  api, ApiError,
  type CampaignWinnerDto, type CouponCampaignDetailDto, type CouponCodeDto,
  type CouponEntryDto,
} from '@pos/api-client';
import { moduleUrls } from '@/config';
import { ModulePageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const CAMPAIGN_TYPES = ['LuckyDraw', 'DiscountCoupon', 'FreeProduct', 'CashGift'];
const STATUSES = ['Draft', 'Active', 'Paused', 'Ended'];
const CODE_STATUSES = ['Active', 'Claimed', 'Redeemed', 'Expired', 'Voided'];

type DetailTab = 'batches' | 'codes' | 'entries' | 'winners' | 'settings';

function scanUrl(internalCode: string) {
  return `${moduleUrls.coupons}/s/${internalCode}`;
}

function qrImageUrl(internalCode: string) {
  return `/api/public/coupons/qr/${internalCode}.png`;
}

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error('Copy failed'),
  );
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CouponCampaignNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', campaignType: 'LuckyDraw', rewardTitle: '',
    rewardValue: '', rewardValueType: 'None', contactUrl: '',
    startsAt: '', endsAt: '',
  });

  const save = async () => {
    try {
      const c = await api.createCouponCampaign({
        name: form.name,
        description: form.description || undefined,
        campaignType: form.campaignType,
        rewardTitle: form.rewardTitle,
        rewardValue: form.rewardValue ? Number(form.rewardValue) : undefined,
        rewardValueType: form.rewardValueType !== 'None' ? form.rewardValueType : undefined,
        contactUrl: form.contactUrl || undefined,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      });
      toast.success('Campaign created');
      navigate(`/coupons/${c.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create campaign');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <ModulePageHeader title="New campaign" description="Choose what customers can win or claim." />
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Type</Label>
            <select className="w-full border rounded-md px-3 py-2 bg-background" value={form.campaignType} onChange={(e) => setForm({ ...form, campaignType: e.target.value })}>
              {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>)}
            </select>
          </div>
          <div><Label>Reward title (shown to customers)</Label><Input value={form.rewardTitle} onChange={(e) => setForm({ ...form, rewardTitle: e.target.value })} placeholder="e.g. 50% off next order" /></div>
          {form.campaignType === 'DiscountCoupon' && (
            <>
              <div>
                <Label>Discount type</Label>
                <select className="w-full border rounded-md px-3 py-2 bg-background" value={form.rewardValueType} onChange={(e) => setForm({ ...form, rewardValueType: e.target.value })}>
                  <option value="Percentage">Percentage</option>
                  <option value="FixedAmount">Fixed MVR</option>
                </select>
              </div>
              <div><Label>Value</Label><Input type="number" value={form.rewardValue} onChange={(e) => setForm({ ...form, rewardValue: e.target.value })} /></div>
            </>
          )}
          <div><Label>Community / contact URL (optional)</Label><Input value={form.contactUrl} onChange={(e) => setForm({ ...form, contactUrl: e.target.value })} placeholder="https://t.me/yourgroup" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Starts at</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
            <div><Label>Ends at</Label><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
          </div>
          <Button onClick={save} disabled={!form.name || !form.rewardTitle}>Create campaign</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function CouponCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CouponCampaignDetailDto | null>(null);
  const [tab, setTab] = useState<DetailTab>('batches');
  const [entries, setEntries] = useState<CouponEntryDto[]>([]);
  const [codes, setCodes] = useState<CouponCodeDto[]>([]);
  const [winners, setWinners] = useState<CampaignWinnerDto[]>([]);
  const [codeSearch, setCodeSearch] = useState('');
  const [codeStatus, setCodeStatus] = useState('');
  const [codeBatchId, setCodeBatchId] = useState('');
  const [batchQty, setBatchQty] = useState('50');
  const [batchName, setBatchName] = useState('Print run 1');
  const [batchPrefix, setBatchPrefix] = useState('');
  const [location, setLocation] = useState('');
  const [editForm, setEditForm] = useState({
    name: '', description: '', campaignType: 'LuckyDraw', status: 'Draft',
    rewardTitle: '', rewardValue: '', rewardValueType: 'None', contactUrl: '',
    startsAt: '', endsAt: '',
  });

  const load = useCallback(async () => {
    if (!id) return;
    const [c, e, w] = await Promise.all([
      api.getCouponCampaign(id),
      api.getCouponEntries(id, 1, 200),
      api.getCampaignWinners(id),
    ]);
    setCampaign(c);
    setEntries(e.items);
    setWinners(w);
    setEditForm({
      name: c.name,
      description: c.description ?? '',
      campaignType: c.campaignType,
      status: c.status,
      rewardTitle: c.rewardTitle,
      rewardValue: c.rewardValue != null ? String(c.rewardValue) : '',
      rewardValueType: c.rewardValueType ?? 'None',
      contactUrl: c.contactUrl ?? '',
      startsAt: toDatetimeLocal(c.startsAt),
      endsAt: toDatetimeLocal(c.endsAt),
    });
  }, [id]);

  const loadCodes = useCallback(async () => {
    if (!id) return;
    const res = await api.getCouponCodes(id, {
      search: codeSearch || undefined,
      status: codeStatus || undefined,
      batchId: codeBatchId || undefined,
      pageSize: 200,
    });
    setCodes(res.items);
  }, [id, codeSearch, codeStatus, codeBatchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'codes') loadCodes(); }, [tab, loadCodes]);

  const generateBatch = async () => {
    if (!id || !campaign) return;
    try {
      const batch = await api.createCouponBatch(id, {
        name: batchName,
        quantity: Number(batchQty),
        prefix: batchPrefix || undefined,
        locationHint: location || undefined,
      });
      toast.success(`Generated ${batch.codesGenerated} QR codes`);
      window.open(`/coupons/${id}/print/${batch.id}`, '_blank');
      load();
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : 'Batch failed');
    }
  };

  const saveSettings = async () => {
    if (!id || !campaign) return;
    try {
      await api.updateCouponCampaign(id, {
        name: editForm.name,
        description: editForm.description || undefined,
        campaignType: editForm.campaignType,
        status: editForm.status,
        rewardTitle: editForm.rewardTitle,
        rewardValue: editForm.rewardValue ? Number(editForm.rewardValue) : undefined,
        rewardValueType: editForm.rewardValueType !== 'None' ? editForm.rewardValueType : undefined,
        contactUrl: editForm.contactUrl || undefined,
        startsAt: editForm.startsAt ? new Date(editForm.startsAt).toISOString() : undefined,
        endsAt: editForm.endsAt ? new Date(editForm.endsAt).toISOString() : undefined,
      });
      toast.success('Campaign updated');
      load();
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const setStatus = async (status: string) => {
    if (!id || !campaign) return;
    await api.updateCouponCampaign(id, {
      name: campaign.name,
      description: campaign.description ?? undefined,
      campaignType: campaign.campaignType,
      status,
      rewardTitle: campaign.rewardTitle,
      rewardValue: campaign.rewardValue ?? undefined,
      rewardValueType: campaign.rewardValueType,
      contactUrl: campaign.contactUrl ?? undefined,
      startsAt: campaign.startsAt ?? undefined,
      endsAt: campaign.endsAt ?? undefined,
    });
    toast.success(`Campaign ${status.toLowerCase()}`);
    load();
  };

  const voidCode = async (codeId: string) => {
    try {
      await api.voidCouponCode(codeId);
      toast.success('Code voided');
      loadCodes();
      load();
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : 'Void failed');
    }
  };

  const markWinner = async (entry: CouponEntryDto) => {
    if (!id) return;
    try {
      await api.assignCampaignWinner({
        campaignId: id,
        couponCodeId: entry.couponCodeId,
        entryId: entry.id,
      });
      toast.success(`${entry.name} marked as winner`);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to assign winner');
    }
  };

  const exportCsv = async (batchId: string) => {
    if (!id) return;
    try {
      await api.exportCouponBatchCsv(id, batchId);
      toast.success('CSV downloaded');
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : 'Export failed');
    }
  };

  if (!campaign) return <p className="text-muted-foreground p-6">Loading…</p>;

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'batches', label: 'QR batches' },
    { id: 'codes', label: 'All codes' },
    { id: 'entries', label: `Entries (${campaign.totalEntries})` },
    { id: 'winners', label: `Winners (${campaign.totalWinners})` },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <ModulePageHeader
        title={campaign.name}
        description={campaign.rewardTitle}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(moduleUrls.coupons, '_blank')}>
              <ExternalLinkIcon className="size-4" /> Live site
            </Button>
            <Button variant="outline" render={<Link to="/coupons" />}>← All campaigns</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{campaign.campaignType.replace(/([A-Z])/g, ' $1').trim()}</Badge>
        <Badge variant={campaign.status === 'Active' ? 'default' : 'outline'}>{campaign.status}</Badge>
        <Badge variant="secondary">{campaign.totalCodes} codes</Badge>
        <Badge variant="secondary">{campaign.totalScans} scans</Badge>
        <Badge variant="secondary">{campaign.totalEntries} entries</Badge>
      </div>

      {campaign.status !== 'Active' && campaign.status !== 'Ended' && (
        <div className="flex gap-2">
          {campaign.status === 'Draft' && <Button size="sm" onClick={() => setStatus('Active')}>Activate</Button>}
          {campaign.status === 'Paused' && <Button size="sm" onClick={() => setStatus('Active')}>Resume</Button>}
          {campaign.status === 'Active' && <Button size="sm" variant="outline" onClick={() => setStatus('Paused')}>Pause</Button>}
          {campaign.status !== 'Ended' && (
            <Button size="sm" variant="destructive" onClick={() => setStatus('Ended')}>End campaign</Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-sm rounded-md ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'batches' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Generate QR print batch</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 max-w-3xl">
              <div><Label>Batch name</Label><Input value={batchName} onChange={(e) => setBatchName(e.target.value)} /></div>
              <div><Label>Quantity (max 5000)</Label><Input type="number" min={1} max={5000} value={batchQty} onChange={(e) => setBatchQty(e.target.value)} /></div>
              <div><Label>Code prefix (optional)</Label><Input value={batchPrefix} onChange={(e) => setBatchPrefix(e.target.value)} placeholder="DEMO-" /></div>
              <div><Label>Location hint</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Counter stickers" /></div>
              <div className="sm:col-span-2">
                <Button onClick={generateBatch} disabled={!batchName || Number(batchQty) < 1}>
                  Generate codes & open print sheet
                </Button>
              </div>
            </CardContent>
          </Card>

          {campaign.batches.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Print batches</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {campaign.batches.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.codesGenerated} codes · prefix {b.prefix}
                        {b.locationHint ? ` · ${b.locationHint}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => exportCsv(b.id)}>
                        <DownloadIcon className="size-4" /> CSV
                      </Button>
                      <Button size="sm" variant="outline" render={<Link to={`/coupons/${id}/print/${b.id}`} target="_blank" />}>
                        <PrinterIcon className="size-4" /> Print
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'codes' && (
        <Card>
          <CardHeader><CardTitle>QR codes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input className="max-w-xs" placeholder="Search code…" value={codeSearch} onChange={(e) => setCodeSearch(e.target.value)} />
              <select className="border rounded-md px-3 py-2 bg-background text-sm" value={codeStatus} onChange={(e) => setCodeStatus(e.target.value)}>
                <option value="">All statuses</option>
                {CODE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="border rounded-md px-3 py-2 bg-background text-sm" value={codeBatchId} onChange={(e) => setCodeBatchId(e.target.value)}>
                <option value="">All batches</option>
                {campaign.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={loadCodes}>Refresh</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR</TableHead>
                  <TableHead>Display code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Claimed by</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No codes match filters.</TableCell></TableRow>
                ) : codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <img src={qrImageUrl(c.internalCode)} alt="" className="size-10 rounded border" />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c.displayCode}</TableCell>
                    <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                    <TableCell>{c.scanCount}</TableCell>
                    <TableCell className="text-sm">{c.entryName ? `${c.entryName} (${c.entryPhone})` : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyText(scanUrl(c.internalCode), 'Scan URL')}>
                          <CopyIcon className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => window.open(scanUrl(c.internalCode), '_blank')}>
                          <ExternalLinkIcon className="size-4" />
                        </Button>
                        {c.status !== 'Voided' && c.status !== 'Redeemed' && (
                          <Button size="sm" variant="ghost" onClick={() => voidCode(c.id)}>
                            <XCircleIcon className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 'entries' && (
        <Card>
          <CardHeader><CardTitle>Customer entries</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No entries yet — print QR stickers and share them.</TableCell></TableRow>
                ) : entries.map((e) => {
                  const isWinner = winners.some((w) => w.entryId === e.id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.displayCode}</TableCell>
                      <TableCell>{e.name}</TableCell>
                      <TableCell>{e.phone}</TableCell>
                      <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {isWinner ? (
                          <Badge><TrophyIcon className="size-3 mr-1" /> Winner</Badge>
                        ) : campaign.campaignType === 'LuckyDraw' ? (
                          <Button size="sm" variant="outline" onClick={() => markWinner(e)}>Mark winner</Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 'winners' && (
        <Card>
          <CardHeader><CardTitle>Winners</CardTitle></CardHeader>
          <CardContent>
            {winners.length === 0 ? (
              <p className="text-muted-foreground py-4">No winners yet. Mark winners from the Entries tab.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Announced</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {winners.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono">{w.displayCode}</TableCell>
                      <TableCell>{w.entryName ?? '—'}</TableCell>
                      <TableCell>{w.entryPhone ?? '—'}</TableCell>
                      <TableCell>{w.announcedAt ? new Date(w.announcedAt).toLocaleString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'settings' && (
        <Card className="max-w-xl">
          <CardHeader><CardTitle>Campaign settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <select className="w-full border rounded-md px-3 py-2 bg-background" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><Label>Reward title</Label><Input value={editForm.rewardTitle} onChange={(e) => setEditForm({ ...editForm, rewardTitle: e.target.value })} /></div>
            <div><Label>Contact URL</Label><Input value={editForm.contactUrl} onChange={(e) => setEditForm({ ...editForm, contactUrl: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Starts at</Label><Input type="datetime-local" value={editForm.startsAt} onChange={(e) => setEditForm({ ...editForm, startsAt: e.target.value })} /></div>
              <div><Label>Ends at</Label><Input type="datetime-local" value={editForm.endsAt} onChange={(e) => setEditForm({ ...editForm, endsAt: e.target.value })} /></div>
            </div>
            <Button onClick={saveSettings}>Save changes</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
