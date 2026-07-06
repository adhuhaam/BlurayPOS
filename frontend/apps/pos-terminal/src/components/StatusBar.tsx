import { Badge } from '@pos/ui';
import { useOnlineStatus, usePendingSyncCount } from '@pos/offline-sync';

export function StatusBar() {
  const online = useOnlineStatus();
  const pending = usePendingSyncCount();

  return (
    <div className="flex items-center gap-3">
      <Badge variant={online ? 'success' : 'danger'}>
        {online ? 'Online' : 'Offline'}
      </Badge>
      {pending > 0 && (
        <Badge variant="warning">{pending} pending sync</Badge>
      )}
    </div>
  );
}
