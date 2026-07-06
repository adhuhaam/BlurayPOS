import { useEffect, useState } from 'react';
import { api, type AuditLogDto } from '@pos/api-client';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getAuditLogs({ entityType: entityType || undefined, pageSize: 100 })
      .then((r) => setLogs(r.items))
      .finally(() => setLoading(false));
  }, [entityType]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit Logs" description="System activity trail" />
      <Input
        placeholder="Filter by entity type..."
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        className="max-w-sm"
      />
      {loading ? <Skeleton className="h-64" /> : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{log.entityType}</Badge></TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{log.changes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
