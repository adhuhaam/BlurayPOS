import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGridIcon, PlusIcon, UsersIcon } from 'lucide-react';
import {
  api,
  type DiningAreaDto,
  type DiningTableDto,
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
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Available: 'secondary',
  Occupied: 'default',
  BillRequested: 'destructive',
  Reserved: 'outline',
  Cleaning: 'outline',
};

function statusLabel(status: string) {
  if (status === 'BillRequested') return 'Bill requested';
  return status;
}

export function DiningTablesPage() {
  const { tenantFeatures } = useAuth();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreId] = useState('');
  const [areas, setAreas] = useState<DiningAreaDto[]>([]);
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [newAreaName, setNewAreaName] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableCode, setTableCode] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');
  const [tableAreaId, setTableAreaId] = useState('');

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [areaList, tableList] = await Promise.all([
        api.getDiningAreas(storeId),
        api.getDiningTables(storeId),
      ]);
      setAreas(areaList);
      setTables(tableList);
    } catch {
      toast.error('Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    api.getStores().then((s) => {
      setStores(s);
      if (s[0]) setStoreId(s[0].id);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const areaOptions = useMemo(
    () => [
      { value: '', label: 'No area (unassigned)' },
      ...areas.map((a) => ({ value: a.id, label: a.name })),
    ],
    [areas],
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
      toast.error('Capacity must be at least 1');
      return;
    }
    try {
      await api.createDiningTable(storeId, {
        name,
        code: tableCode.trim() || undefined,
        capacity,
        diningAreaId: tableAreaId || undefined,
      });
      setTableName('');
      setTableCode('');
      setTableCapacity('4');
      toast.success('Table added');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add table');
    }
  };

  if (tenantFeatures && !tenantFeatures.posTables) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tables & Areas"
        description="Set up dining areas and tables for restaurant POS and kitchen flow"
      />

      <div className="max-w-xs">
        <Label>Branch</Label>
        <FormSelect
          value={storeId}
          onChange={setStoreId}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
        />
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
            <CardDescription>Tables appear on POS and Android terminal</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Table 1"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
              <div>
                <Label>Code (optional)</Label>
                <Input
                  placeholder="T1"
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
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
            <section key={area.id}>
              <div className="mb-3 flex items-center gap-2">
                <LayoutGridIcon className="size-4 text-muted-foreground" />
                <h2 className="font-semibold">{area.name}</h2>
                <Badge variant="outline">{area.tableCount} tables</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(tablesByArea.get(area.id) ?? []).map((t) => (
                  <TableCard key={t.id} table={t} />
                ))}
                {(tablesByArea.get(area.id) ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">No tables in this area yet.</p>
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
                  <TableCard key={t.id} table={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TableCard({ table }: { table: DiningTableDto }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{table.name}</p>
            {table.code && table.code !== table.name && (
              <p className="text-xs text-muted-foreground">{table.code}</p>
            )}
          </div>
          <Badge variant={STATUS_VARIANT[table.status] ?? 'outline'}>
            {statusLabel(table.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="size-3.5" />
            {table.capacity} seats
          </span>
          {table.activeOrderNumber && (
            <span>Order {table.activeOrderNumber}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
