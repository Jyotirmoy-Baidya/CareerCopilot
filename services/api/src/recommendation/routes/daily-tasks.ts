import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { roadmapNodes, dailyTasks, skillNodes } from '@careercopliot/db';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/requireAuth';
import { isoDateString } from '@careercopliot/utils';

const router = Router();

const schema = z.object({
  roadmapId: z.string().uuid(),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const userId      = req.user!.id;
  const { roadmapId } = parsed.data;
  const today       = isoDateString();

  // Return today's existing tasks if already generated
  const existing = await db.query.dailyTasks.findMany({
    where: and(eq(dailyTasks.userId, userId), eq(dailyTasks.dueDate, today)),
  });
  if (existing.length > 0) return res.json({ tasks: existing });

  // Pick next 3 incomplete nodes from the roadmap
  const nextNodes = await db.query.roadmapNodes.findMany({
    where: and(eq(roadmapNodes.roadmapId, roadmapId), eq(roadmapNodes.isCompleted, false)),
    orderBy: (n, { asc }) => [asc(n.order)],
    limit: 3,
    with: { skillNode: true },
  });

  if (nextNodes.length === 0) {
    return res.json({ tasks: [], message: 'Roadmap complete' });
  }

  const inserted = await db
    .insert(dailyTasks)
    .values(
      nextNodes.map(node => ({
        userId,
        roadmapId,
        skillId:      node.skillId,
        title:        `Learn ${(node as any).skillNode?.name ?? 'next skill'}`,
        description:  (node as any).skillNode?.description ?? null,
        dueDate:      today,
        estimatedMin: Math.round(((node as any).skillNode?.estimatedHrs ?? 1) * 60 / 5),
      }))
    )
    .returning();

  return res.json({ tasks: inserted });
});

export default router;
