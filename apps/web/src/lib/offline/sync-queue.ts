import { offlineDB, type SyncQueueItem } from './dexie';

export async function enqueueOp(
  opType: SyncQueueItem['opType'],
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await offlineDB.syncQueue.add({
    opType,
    entityId,
    payload:      JSON.stringify(payload),
    createdAt:    Date.now(),
    retries:      0,
    lastAttemptAt: null,
  });
}

export async function getPendingOps(): Promise<SyncQueueItem[]> {
  return offlineDB.syncQueue.where('retries').below(3).sortBy('createdAt');
}

export async function markSynced(id: number): Promise<void> {
  await offlineDB.syncQueue.delete(id);
}

export async function markFailed(id: number): Promise<void> {
  await offlineDB.syncQueue.where('id').equals(id).modify(item => {
    item.retries += 1;
    item.lastAttemptAt = Date.now();
  });
}

export async function getPendingCount(): Promise<number> {
  return offlineDB.syncQueue.where('retries').below(3).count();
}
