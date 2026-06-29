import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { dailyTasks } from '@careercopliot/db';
import { requireAuth } from '../middleware/requireAuth';
import { isoDateString } from '@careercopliot/utils';

const router = Router();

const schema = z.object({
  title:        z.string().min(1).max(500),
  description:  z.string().max(2000).optional(),
  estimatedMin: z.number().int().min(1).max(480).optional(),
  dueDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const { title, description, estimatedMin, dueDate } = parsed.data;

  const [task] = await db
    .insert(dailyTasks)
    .values({
      userId,
      title,
      description:  description ?? null,
      estimatedMin: estimatedMin ?? 30,
      dueDate:      dueDate ?? isoDateString(),
      status:       'pending',
    })
    .returning();

  return res.status(201).json({ task });
});

export default router;
