import { eq, lt, and } from 'drizzle-orm';
import { db } from '../client';
import { syncOps, offlineSyncQueue } from '../schema';

export async function logSyncOp(data: {
  noteId?: string;
  userId: string;
  opType: string;
  byteSize?: number;
}) {
  await db.insert(syncOps).values(data);
}

export async function getPendingQueueOps(userId: string, limit = 100) {
  return db.query.offlineSyncQueue.findMany({
    where: and(
      eq(offlineSyncQueue.userId, userId),
      eq(offlineSyncQueue.status, 'pending'),
      lt(offlineSyncQueue.retries, 3)
    ),
    orderBy: (q, { asc }) => [asc(q.createdAt)],
    limit,
  });
}

export async function markQueueOpDone(id: string) {
  await db
    .update(offlineSyncQueue)
    .set({ status: 'done', processedAt: new Date() })
    .where(eq(offlineSyncQueue.id, id));
}

export async function incrementQueueOpRetry(id: string) {
  const op = await db.query.offlineSyncQueue.findFirst({
    where: eq(offlineSyncQueue.id, id),
  });
  if (op) {
    await db
      .update(offlineSyncQueue)
      .set({ retries: op.retries + 1 })
      .where(eq(offlineSyncQueue.id, id));
  }
}
