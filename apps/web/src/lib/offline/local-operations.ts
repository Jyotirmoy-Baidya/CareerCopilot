import { offlineDB, type LocalTask } from './dexie';
import { enqueueOp } from './sync-queue';

export async function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
): Promise<void> {
  const now         = Date.now();
  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  // Write to IndexedDB first — UI reacts instantly, no network needed
  await offlineDB.tasks.update(taskId, { status, completedAt, synced: false, updatedAt: now });

  await enqueueOp('task_update', taskId, { taskId, status, completedAt, timestamp: now, version: now });
}

export async function completeRoadmapNode(nodeId: string): Promise<void> {
  const now         = Date.now();
  const completedAt = new Date().toISOString();

  await offlineDB.roadmapNodes.update(nodeId, {
    isCompleted: true,
    completedAt,
    synced:      false,
    updatedAt:   now,
  });

  await enqueueOp('roadmap_node_update', nodeId, { nodeId, isCompleted: true, completedAt, timestamp: now, version: now });
}

export async function seedLocalTasks(
  tasks: Array<{
    id: string; userId: string; roadmapId: string | null; skillId: string | null;
    title: string; description: string | null; status: string;
    dueDate: string; estimatedMin: number; completedAt: string | null; createdAt: string;
  }>
): Promise<void> {
  await offlineDB.tasks.bulkPut(
    tasks.map(t => ({
      ...t,
      status:    t.status as LocalTask['status'],
      synced:    true,
      updatedAt: new Date(t.createdAt).getTime(),
      createdAt: new Date(t.createdAt).getTime(),
    }))
  );
}
