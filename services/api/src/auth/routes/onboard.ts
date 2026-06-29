import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { users, userSkills, skillNodes } from '@careercopliot/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const schema = z.object({
  targetRole:    z.string().min(1).max(100),
  knownSlugs:    z.array(z.string()).max(50),
  weeklyGoalHrs: z.number().min(1).max(40).optional(),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const { targetRole, knownSlugs, weeklyGoalHrs } = parsed.data;
  const userId = req.user!.id;

  await db
    .update(users)
    .set({ targetRole, weeklyGoalHrs: weeklyGoalHrs ?? 10, isOnboarded: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Persist the skills the user already knows so gap-analysis skips them
  if (knownSlugs.length > 0) {
    const nodes = await db.query.skillNodes.findMany({
      where: (n, { inArray }) => inArray(n.slug, knownSlugs),
      columns: { id: true },
    });
    if (nodes.length > 0) {
      await db
        .insert(userSkills)
        .values(nodes.map(n => ({ userId, skillId: n.id, confidence: 80 })))
        .onConflictDoNothing();
    }
  }

  return res.json({ message: 'Onboarding complete' });
});

export default router;
