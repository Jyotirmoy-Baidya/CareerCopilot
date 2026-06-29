import { eq, and, asc, sql } from 'drizzle-orm';
import { db } from '../client';
import { roadmaps, roadmapNodes } from '../schema';

export async function getRoadmapByUserId(userId: string) {
  return db.query.roadmaps.findFirst({
    where: and(eq(roadmaps.userId, userId), eq(roadmaps.status, 'active')),
    with: {
      nodes: {
        with: { skillNode: true },
        orderBy: [asc(roadmapNodes.order)],
      },
    },
  });
}

export async function createRoadmap(data: {
  userId: string;
  title: string;
  targetRole: string;
  totalSkills: number;
  estimatedDays: number;
}) {
  const [roadmap] = await db.insert(roadmaps).values(data).returning();
  return roadmap;
}

export async function markNodeComplete(nodeId: string) {
  const [node] = await db
    .update(roadmapNodes)
    .set({ isCompleted: true, completedAt: new Date() })
    .where(eq(roadmapNodes.id, nodeId))
    .returning();

  if (node) {
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(roadmapNodes)
      .where(and(eq(roadmapNodes.roadmapId, node.roadmapId), eq(roadmapNodes.isCompleted, true)));

    await db
      .update(roadmaps)
      .set({ doneSkills: count })
      .where(eq(roadmaps.id, node.roadmapId));
  }
  return node;
}
