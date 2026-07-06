import { useState, useEffect } from 'react';
import { getPendingOutboxCount } from './db.js';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

export function usePendingSyncCount(pollMs = 5000): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const pending = await getPendingOutboxCount();
        if (mounted) setCount(pending);
      } catch {
        if (mounted) setCount(0);
      }
    };

    refresh();
    const interval = setInterval(refresh, pollMs);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pollMs]);

  return count;
}
