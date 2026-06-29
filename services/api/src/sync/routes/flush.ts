import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { dailyTasks, roadmapNodes, syncOps } from '@careercopliot/db';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const opSchema = z.discriminatedUnion('type', [
  z.object({
    type:      z.literal('task_update'),
    payload:   z.object({
      taskId:      z.string().uuid(),
      status:      z.enum(['pending', 'in_progress', 'completed', 'skipped']),
      completedAt: z.string().nullable(),
    }),
    timestamp: z.number(),
    version:   z.number(),
  }),
  z.object({
    type:      z.literal('roadmap_node_update'),
    payload:   z.object({
      nodeId:      z.string().uuid(),
      isCompleted: z.boolean(),
      completedAt: z.string(),
    }),
    timestamp: z.number(),
    version:   z.number(),
  }),
  z.object({
    type:      z.literal('task_create'),
    payload:   z.object({
      title:        z.string().max(500),
      dueDate:      z.string(),
      estimatedMin: z.number().optional(),
    }),
    timestamp: z.number(),
    version:   z.number(),
  }),
]);

const bodySchema = z.object({
  ops: z.array(opSchema).max(100),
});

router.post('/', requireAuth, async (req, res) => {
  // Reject oversized payloads before parsing (belt-and-suspenders on top of express.json limit)
  const contentLen = req.headers['content-length'];
  if (contentLen && parseInt(contentLen) > 512 * 1024) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const results: { opIndex: number; status: 'ok' | 'error'; reason?: string }[] = [];

  for (let i = 0; i < parsed.data.ops.length; i++) {
    const op = parsed.data.ops[i];
    try {
      if (op.type === 'task_update') {
        await db
          .update(dailyTasks)
          .set({
            status:      op.payload.status,
            completedAt: op.payload.completedAt ? new Date(op.payload.completedAt) : null,
          })
          .where(and(eq(dailyTasks.id, op.payload.taskId), eq(dailyTasks.userId, userId)));
      } else if (op.type === 'roadmap_node_update') {
        await db
          .update(roadmapNodes)
          .set({ isCompleted: op.payload.isCompleted, completedAt: new Date(op.payload.completedAt) })
          .where(eq(roadmapNodes.id, op.payload.nodeId));
      }

      await db.insert(syncOps).values({ userId, opType: op.type, byteSize: JSON.stringify(op).length });
      results.push({ opIndex: i, status: 'ok' });
    } catch (err) {
      results.push({ opIndex: i, status: 'error', reason: 'db write failed' });
    }
  }

  return res.json({ processed: results.length, results });
});

export default router;
