'use client';

import { useSyncStore } from '@/stores/sync.store';

export function OfflineBanner() {
  const isOffline    = useSyncStore(s => s.isOffline);
  const isSyncing    = useSyncStore(s => s.isSyncing);
  const pendingCount = useSyncStore(s => s.pendingCount);
  const lastSyncedAt = useSyncStore(s => s.lastSyncedAt);

  if (!isOffline && !isSyncing && pendingCount === 0) return null;

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium
      ${isOffline ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}
    `}>
      {isOffline && (
        <span>
          Offline — {pendingCount > 0
            ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} saved locally`
            : 'all changes saved locally'}
        </span>
      )}
      {!isOffline && isSyncing && (
        <span>Syncing {pendingCount} change{pendingCount !== 1 ? 's' : ''}…</span>
      )}
      {!isOffline && !isSyncing && pendingCount === 0 && lastSyncedAt && (
        <span>All changes synced</span>
      )}
    </div>
  );
}
