import { create } from 'zustand';
import { getPendingOps, markSynced, markFailed, getPendingCount } from '@/lib/offline/sync-queue';

interface SyncState {
  isOffline:    boolean;
  isSyncing:    boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;

  setOffline:   (v: boolean) => void;
  flushQueue:   (accessToken: string) => Promise<void>;
  refreshCount: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOffline:    typeof window !== 'undefined' ? !navigator.onLine : false,
  isSyncing:    false,
  pendingCount: 0,
  lastSyncedAt: null,

  setOffline: (v) => set({ isOffline: v }),

  refreshCount: async () => {
    const count = await getPendingCount();
    set({ pendingCount: count });
  },

  flushQueue: async (accessToken) => {
    if (!accessToken || !navigator.onLine) return;
    if (get().isSyncing) return;

    const pending = await getPendingOps();
    if (pending.length === 0) return;

    set({ isSyncing: true });

    for (const op of pending) {
      try {
        const res = await fetch('/api/sync', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ops: [{
              type:      op.opType,
              payload:   JSON.parse(op.payload),
              timestamp: op.createdAt,
              version:   JSON.parse(op.payload).version ?? op.createdAt,
            }],
          }),
        });
        if (res.ok)                              await markSynced(op.id!);
        else if (res.status >= 400 && res.status < 500) await markSynced(op.id!);
        else                                     await markFailed(op.id!);
      } catch {
        await markFailed(op.id!);
        break;
      }
    }

    set({ isSyncing: false, lastSyncedAt: new Date(), pendingCount: await getPendingCount() });
  },
}));
