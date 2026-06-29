import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { db } from '@careercopliot/db';
import { users } from '@careercopliot/db';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.id) });
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    id:          user.id,
    name:        user.name,
    email:       user.email,
    role:        user.role,
    targetRole:  user.targetRole,
    isOnboarded: user.isOnboarded,
    avatarUrl:   user.avatarUrl,
    weeklyGoalHrs: user.weeklyGoalHrs,
  });
});

export default router;
