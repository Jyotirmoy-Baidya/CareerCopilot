'use client';

import { useEffect, useCallback, useState } from 'react';
import { getPendingOps, markSynced, markFailed, getPendingCount } from '@/lib/offline/sync-queue';
import { useSession } from 'next-auth/react';

export function useSyncEngine() {
  const { data: session } = useSession();
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const flushQueue = useCallback(async () => {
    if (!session?.accessToken || !navigator.onLine) return;

    const pending = await getPendingOps();
    if (pending.length === 0) return;

    setIsSyncing(true);

    for (const op of pending) {
      try {
        const res = await fetch('/api/sync', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            ops: [{
              type:      op.opType,
              payload:   JSON.parse(op.payload),
              timestamp: op.createdAt,
              version:   JSON.parse(op.payload).version ?? op.createdAt,
            }],
          }),
        });

        if (res.ok) {
          await markSynced(op.id!);
        } else if (res.status >= 400 && res.status < 500) {
          await markSynced(op.id!); // client error — no point retrying
        } else {
          await markFailed(op.id!);
        }
      } catch {
        await markFailed(op.id!);
        break; // network is down — stop trying
      }
    }

    setIsSyncing(false);
    setLastSyncedAt(new Date());
    setPendingCount(await getPendingCount());
  }, [session]);

  useEffect(() => {
    if (navigator.onLine) flushQueue();
  }, [flushQueue]);

  useEffect(() => {
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, [flushQueue]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setPendingCount(await getPendingCount());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return { isSyncing, pendingCount, lastSyncedAt, flushQueue };
}
