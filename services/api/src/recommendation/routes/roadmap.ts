import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { skillNodes, skillEdges, userSkills, roadmaps, roadmapNodes } from '@careercopliot/db';
import { eq, and } from 'drizzle-orm';
import { topologicalSort } from '../graph/topological-sort';
import { gapAnalysis } from '../graph/gap-analysis';
import { requireAuth } from '../middleware/requireAuth';
import type Redis from 'ioredis';

const router = Router();

const schema = z.object({
  targetRole: z.string().min(1).max(100),
});

export function createRoadmapRouter(redis: Redis) {
  router.post('/', requireAuth, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const userId          = req.user!.id;
    const { targetRole }  = parsed.data;
    // v2 cache key — includes resourceUrl, category, and correct nodeId/isCompleted
    const cacheKey        = `recommend:roadmap:v2:${userId}:${targetRole}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const categoryMap: Record<string, string[]> = {
      fullstack:      ['fullstack'],
      frontend:       ['fullstack', 'frontend'],
      backend:        ['fullstack', 'backend'],
      devops:         ['fullstack', 'devops'],
      'data-science': ['data-science'],
    };

    const categories = categoryMap[targetRole] ?? ['fullstack'];

    const allNodes = await db.query.skillNodes.findMany({
      where: (s, { inArray }) => inArray(s.category, categories),
    });

    const allEdges = await db.query.skillEdges.findMany();
    const relevantNodeIds = new Set(allNodes.map(n => n.id));
    const relevantEdges   = allEdges.filter(
      e => relevantNodeIds.has(e.fromSkillId) && relevantNodeIds.has(e.toSkillId)
    );

    const sortedIds = topologicalSort(allNodes, relevantEdges);

    const known = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, userId),
    });
    const knownIds = new Set(known.map(k => k.skillId));

    const gapIds   = gapAnalysis(sortedIds, knownIds);
    const nodeMap  = new Map(allNodes.map(n => [n.id, n]));
    const totalHrs = gapIds.reduce((sum, id) => sum + (nodeMap.get(id)?.estimatedHrs ?? 0), 0);
    const estimatedDays = Math.ceil(totalHrs / 2);

    let roadmap = await db.query.roadmaps.findFirst({
      where: and(eq(roadmaps.userId, userId), eq(roadmaps.status, 'active')),
    });

    type SkillRow = {
      nodeId:       string;
      skillId:      string;
      slug:         string;
      name:         string;
      description:  string | null;
      category:     string;
      level:        'beginner' | 'intermediate' | 'advanced';
      estimatedHrs: number;
      resourceUrl:  string | null;
      isCompleted:  boolean;
      order:        number;
    };

    let skillsForResult: SkillRow[] = [];

    if (!roadmap) {
      const [created] = await db.insert(roadmaps).values({
        userId,
        title:         `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} Developer Path`,
        targetRole,
        totalSkills:   gapIds.length,
        estimatedDays,
      }).returning();
      roadmap = created;

      if (gapIds.length > 0) {
        const inserted = await db.insert(roadmapNodes).values(
          gapIds.map((skillId, i) => ({ roadmapId: roadmap!.id, skillId, order: i + 1 }))
        ).returning();

        skillsForResult = inserted
          .sort((a, b) => a.order - b.order)
          .map(node => {
            const skill = nodeMap.get(node.skillId)!;
            return {
              nodeId:       node.id,
              skillId:      node.skillId,
              slug:         skill.slug,
              name:         skill.name,
              description:  skill.description,
              category:     skill.category,
              level:        skill.level,
              estimatedHrs: skill.estimatedHrs,
              resourceUrl:  skill.resourceUrl,
              isCompleted:  false,
              order:        node.order,
            };
          });
      }
    } else {
      // Load existing nodes with their actual IDs and completion state
      const existingNodes = await db.query.roadmapNodes.findMany({
        where: eq(roadmapNodes.roadmapId, roadmap.id),
      });

      skillsForResult = existingNodes
        .sort((a, b) => a.order - b.order)
        .flatMap(node => {
          const skill = nodeMap.get(node.skillId);
          if (!skill) return [];
          return [{
            nodeId:       node.id,
            skillId:      node.skillId,
            slug:         skill.slug,
            name:         skill.name,
            description:  skill.description,
            category:     skill.category,
            level:        skill.level,
            estimatedHrs: skill.estimatedHrs,
            resourceUrl:  skill.resourceUrl,
            isCompleted:  node.isCompleted,
            order:        node.order,
          }];
        });
    }

    const doneSkills = skillsForResult.filter(s => s.isCompleted).length;

    const result = {
      roadmapId:     roadmap.id,
      userId,
      targetRole,
      title:         roadmap.title,
      totalSkills:   skillsForResult.length,
      doneSkills,
      estimatedDays: roadmap.estimatedDays ?? estimatedDays,
      skills:        skillsForResult,
    };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
    return res.json(result);
  });

  return router;
}
