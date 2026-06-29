'use client';

import { useSyncStore } from '@/stores/sync.store';

export function SyncIndicator() {
  const isOffline    = useSyncStore(s => s.isOffline);
  const isSyncing    = useSyncStore(s => s.isSyncing);
  const pendingCount = useSyncStore(s => s.pendingCount);

  if (isOffline) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-700">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        Offline
      </span>
    );
  }

  if (isSyncing || pendingCount > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-teal-700">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        Syncing
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-2 h-2 rounded-full bg-green-400" />
      Synced
    </span>
  );
}
