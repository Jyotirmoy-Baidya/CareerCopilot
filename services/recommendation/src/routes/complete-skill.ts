import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { roadmapNodes, roadmaps, skillNodes } from '@careercopliot/db';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/requireAuth';
import type Redis from 'ioredis';

const router = Router();

const schema = z.object({
  nodeId:    z.string().uuid(),
  roadmapId: z.string().uuid(),
});

export function createCompleteSkillRouter(notificationUrl: string, redis: Redis) {
  router.post('/', requireAuth, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { nodeId, roadmapId } = parsed.data;
    const userId = req.user!.id;

    const [node] = await db
      .update(roadmapNodes)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(and(eq(roadmapNodes.id, nodeId), eq(roadmapNodes.roadmapId, roadmapId)))
      .returning();

    if (!node) return res.status(404).json({ error: 'Node not found' });

    const allNodes = await db.query.roadmapNodes.findMany({
      where: eq(roadmapNodes.roadmapId, roadmapId),
    });
    const done  = allNodes.filter(n => n.isCompleted).length;
    const total = allNodes.length;
    const pct   = Math.round((done / total) * 100);

    const [updatedRoadmap] = await db
      .update(roadmaps)
      .set({ doneSkills: done, status: done === total ? 'completed' : 'active' })
      .where(eq(roadmaps.id, roadmapId))
      .returning();

    // Delete Redis cache so the next roadmap fetch reflects the updated state
    if (updatedRoadmap) {
      await redis.del(`recommend:roadmap:v2:${userId}:${updatedRoadmap.targetRole}`);
    }

    const skill = await db.query.skillNodes.findFirst({ where: eq(skillNodes.id, node.skillId) });
    fetch(`${notificationUrl}/notification/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:   'milestone',
        userId,
        data:   { skillName: skill?.name ?? 'a skill', progressPct: pct },
      }),
    }).catch(() => {/* non-critical */});

    return res.json({ nodeId, done, total, progressPct: pct });
  });

  return router;
}
