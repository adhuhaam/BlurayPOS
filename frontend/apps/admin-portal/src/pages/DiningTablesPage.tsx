import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGridIcon, PencilIcon, PlusIcon, UsersIcon } from 'lucide-react';
import {
  api,
  type DiningAreaDto,
  type DiningTableDto,
  type DiningTableSize,
  type StoreDto,
} from '@pos/api-client';
import { useAuth } from '@/auth';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FormSelect } from '@/components/form-select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Available: 'secondary',
  Occupied: 'default',
  BillRequested: 'destructive',
  Reserved: 'outline',
  Cleaning: 'outline',
};

const SIZE_OPTIONS: { value: DiningTableSize; label: string }[] = [
  { value: 'Small', label: 'Small (2-top)' },
  { value: 'Medium', label: 'Medium (4-top)' },
  { value: 'Large', label: 'Large (6+ top)' },
];

const SIZE_GRID_CLASS: Record<DiningTableSize, string> = {
  Small: 'min-h-20',
  Medium: 'min-h-24',
  Large: 'min-h-28 col-span-2',
};

function statusLabel(status: string) {
  if (status === 'BillRequested') return 'Bill requested';
  return status;
}

function ActiveToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="size-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function DiningTablesPage() {
  const { tenantFeatures } = useAuth();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [areas, setAreas] = useState<DiningAreaDto[]>([]);
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);

  const [newAreaName, setNewAreaName] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableCode, setTableCode] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');
  const [tableSize, setTableSize] = useState<DiningTableSize>('Medium');
  const [tableAreaId, setTableAreaId] = useState('');

  const [areaDialog, setAreaDialog] = useState<DiningAreaDto | null>(null);
  const [areaForm, setAreaForm] = useState({ name: '', sortOrder: '0', isActive: true });

  const [tableDialog, setTableDialog] = useState<DiningTableDto | null>(null);
  const [tableForm, setTableForm] = useState({
    name: '',
    code: '',
    capacity: '4',
    size: 'Medium' as DiningTableSize,
    diningAreaId: '',
    sortOrder: '0',
    isActive: true,
  });

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [areaList, tableList] = await Promise.all([
        api.getDiningAreas(storeId, showInactive),
        api.getDiningTables(storeId, showInactive),
      ]);
      setAreas(areaList);
      setTables(tableList);
    } catch {
      toast.error('Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  }, [storeId, showInactive]);

  useEffect(() => {
    api.getStores().then((s) => {
      setStores(s);
      if (s[0]) setStoreId(s[0].id);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeAreaOptions = useMemo(
    () => areas.filter((a) => a.isActive).map((a) => ({ value: a.id, label: a.name })),
    [areas],
  );

  const areaOptions = useMemo(
    () => [
      { value: '', label: 'No area (unassigned)' },
      ...activeAreaOptions,
    ],
    [activeAreaOptions],
  );

  const tablesByArea = useMemo(() => {
    const grouped = new Map<string, DiningTableDto[]>();
    grouped.set('__none__', []);
    for (const area of areas) grouped.set(area.id, []);
    for (const table of tables) {
      const key = table.diningAreaId ?? '__none__';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(table);
    }
    return grouped;
  }, [areas, tables]);

  const addArea = async () => {
    const name = newAreaName.trim();
    if (!name) return;
    try {
      await api.createDiningArea(storeId, { name });
      setNewAreaName('');
      toast.success('Area added');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add area');
    }
  };

  const addTable = async () => {
    const name = tableName.trim();
    if (!name) return;
    const capacity = Number.parseInt(tableCapacity, 10);
    if (!Number.isFinite(capacity) || capacity < 1) {
      toast.error('Seats must be at least 1');
      return;
    }
    try {
      await api.createDiningTable(storeId, {
        name,
        code: tableCode.trim() || undefined,
        capacity,
        size: tableSize,
        diningAreaId: tableAreaId || undefined,
      });
      setTableName('');
      setTableCode('');
      setTableCapacity('4');
      setTableSize('Medium');
      toast.success('Table added');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add table');
    }
  };

  const openEditArea = (area: DiningAreaDto) => {
    setAreaDialog(area);
    setAreaForm({ name: area.name, sortOrder: String(area.sortOrder), isActive: area.isActive });
  };

  const saveArea = async () => {
    if (!areaDialog) return;
    try {
      await api.updateDiningArea(areaDialog.id, {
        name: areaForm.name.trim(),
        sortOrder: Number.parseInt(areaForm.sortOrder, 10) || 0,
        isActive: areaForm.isActive,
      });
      toast.success(areaForm.isActive ? 'Area updated' : 'Area deactivated');
      setAreaDialog(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update area');
    }
  };

  const openEditTable = (table: DiningTableDto) => {
    setTableDialog(table);
    setTableForm({
      name: table.name,
      code: table.code ?? '',
      capacity: String(table.capacity),
      size: table.size ?? 'Medium',
      diningAreaId: table.diningAreaId ?? '',
      sortOrder: '0',
      isActive: table.isActive,
    });
  };

  const saveTable = async () => {
    if (!tableDialog) return;
    const capacity = Number.parseInt(tableForm.capacity, 10);
    if (!Number.isFinite(capacity) || capacity < 1) {
      toast.error('Seats must be at least 1');
      return;
    }
    try {
      await api.updateDiningTable(tableDialog.id, {
        name: tableForm.name.trim(),
        code: tableForm.code.trim() || undefined,
        capacity,
        size: tableForm.size,
        diningAreaId: tableForm.diningAreaId || null,
        sortOrder: Number.parseInt(tableForm.sortOrder, 10) || 0,
        isActive: tableForm.isActive,
      });
      toast.success(tableForm.isActive ? 'Table updated' : 'Table deactivated');
      setTableDialog(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update table');
    }
  };

  if (tenantFeatures && !tenantFeatures.posTables) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tables & Areas"
        description="Managers can add, edit, and activate or deactivate dining areas and tables"
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="max-w-xs flex-1">
          <Label>Branch</Label>
          <FormSelect
            value={storeId}
            onChange={setStoreId}
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
        <ActiveToggle label="Show inactive areas & tables" checked={showInactive} onChange={setShowInactive} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add area</CardTitle>
            <CardDescription>e.g. Main Floor, Terrace, VIP room</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Input
              placeholder="Area name"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && addArea()}
            />
            <Button onClick={addArea}>
              <PlusIcon data-icon="inline-start" />
              Add area
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add table</CardTitle>
            <CardDescription>Set seats, size, and area — shown on POS floor plan</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input placeholder="Table 1" value={tableName} onChange={(e) => setTableName(e.target.value)} />
              </div>
              <div>
                <Label>Code (optional)</Label>
                <Input placeholder="T1" value={tableCode} onChange={(e) => setTableCode(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Seats</Label>
                <Input type="number" min={1} value={tableCapacity} onChange={(e) => setTableCapacity(e.target.value)} />
              </div>
              <div>
                <Label>Size</Label>
                <FormSelect
                  value={tableSize}
                  onChange={(v) => setTableSize(v as DiningTableSize)}
                  options={SIZE_OPTIONS}
                />
              </div>
              <div>
                <Label>Area</Label>
                <FormSelect value={tableAreaId} onChange={setTableAreaId} options={areaOptions} />
              </div>
            </div>
            <Button onClick={addTable} className="w-fit">
              <PlusIcon data-icon="inline-start" />
              Add table
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {areas.length === 0 && tables.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No areas or tables yet. Add a dining area, then add tables for your floor plan.
              </CardContent>
            </Card>
          )}

          {areas.map((area) => (
            <section key={area.id} className={!area.isActive ? 'opacity-60' : undefined}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <LayoutGridIcon className="size-4 text-muted-foreground" />
                <h2 className="font-semibold">{area.name}</h2>
                <Badge variant="outline">{area.tableCount} tables</Badge>
                {!area.isActive && <Badge variant="destructive">Inactive</Badge>}
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => openEditArea(area)}>
                  <PencilIcon className="size-3.5" data-icon="inline-start" />
                  Edit area
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(tablesByArea.get(area.id) ?? []).map((t) => (
                  <TableCard key={t.id} table={t} onEdit={() => openEditTable(t)} />
                ))}
                {(tablesByArea.get(area.id) ?? []).length === 0 && (
                  <p className="col-span-full text-sm text-muted-foreground">No tables in this area yet.</p>
                )}
              </div>
            </section>
          ))}

          {(tablesByArea.get('__none__') ?? []).length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-semibold">Unassigned</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(tablesByArea.get('__none__') ?? []).map((t) => (
                  <TableCard key={t.id} table={t} onEdit={() => openEditTable(t)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={!!areaDialog} onOpenChange={(open) => !open && setAreaDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit area</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Name</Label>
              <Input value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={areaForm.sortOrder} onChange={(e) => setAreaForm({ ...areaForm, sortOrder: e.target.value })} />
            </div>
            <ActiveToggle label="Area active (visible on POS)" checked={areaForm.isActive} onChange={(v) => setAreaForm({ ...areaForm, isActive: v })} />
            {!areaForm.isActive && (
              <p className="text-xs text-muted-foreground">Deactivating an area also deactivates all its tables.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaDialog(null)}>Cancel</Button>
            <Button onClick={saveArea}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tableDialog} onOpenChange={(open) => !open && setTableDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit table</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Code</Label>
                <Input value={tableForm.code} onChange={(e) => setTableForm({ ...tableForm, code: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Seats</Label>
                <Input type="number" min={1} value={tableForm.capacity} onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })} />
              </div>
              <div>
                <Label>Size</Label>
                <FormSelect
                  value={tableForm.size}
                  onChange={(v) => setTableForm({ ...tableForm, size: v as DiningTableSize })}
                  options={SIZE_OPTIONS}
                />
              </div>
              <div>
                <Label>Area</Label>
                <FormSelect
                  value={tableForm.diningAreaId}
                  onChange={(v) => setTableForm({ ...tableForm, diningAreaId: v })}
                  options={areaOptions}
                />
              </div>
            </div>
            <ActiveToggle label="Table active (available on POS)" checked={tableForm.isActive} onChange={(v) => setTableForm({ ...tableForm, isActive: v })} />
            {tableDialog?.activeOrderNumber && !tableForm.isActive && (
              <p className="text-xs text-destructive">Cannot deactivate while order {tableDialog.activeOrderNumber} is open.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialog(null)}>Cancel</Button>
            <Button onClick={saveTable}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableCard({ table, onEdit }: { table: DiningTableDto; onEdit: () => void }) {
  const size = (table.size ?? 'Medium') as DiningTableSize;
  return (
    <Card className={`${SIZE_GRID_CLASS[size]} ${!table.isActive ? 'opacity-50' : ''}`}>
      <CardContent className="flex h-full flex-col gap-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{table.name}</p>
            {table.code && table.code !== table.name && (
              <p className="text-xs text-muted-foreground">{table.code}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {!table.isActive ? (
              <Badge variant="destructive">Inactive</Badge>
            ) : (
              <Badge variant={STATUS_VARIANT[table.status] ?? 'outline'}>
                {statusLabel(table.status)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="size-3.5" />
            {table.capacity} seats
          </span>
          <Badge variant="outline" className="text-[10px]">{size}</Badge>
          {table.activeOrderNumber && <span>Order {table.activeOrderNumber}</span>}
        </div>
        <Button variant="ghost" size="sm" className="mt-auto w-fit" onClick={onEdit}>
          <PencilIcon className="size-3.5" data-icon="inline-start" />
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}
