import { Router } from 'express';
import { z } from 'zod';
import { Queue } from 'bullmq';

const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily_reminder'),   userId: z.string().uuid(), data: z.object({ streakDays:     z.number() }) }),
  z.object({ type: z.literal('inactivity_alert'), userId: z.string().uuid(), data: z.object({ daysSince:      z.number() }) }),
  z.object({ type: z.literal('milestone'),        userId: z.string().uuid(), data: z.object({ skillName:      z.string(), progressPct: z.number() }) }),
  z.object({ type: z.literal('weekly_report'),    userId: z.string().uuid(), data: z.object({ tasksCompleted: z.number(), summary:     z.string() }) }),
  z.object({ type: z.literal('group_joined'),     userId: z.string().uuid(), data: z.object({ groupName:      z.string(), inviteCode:  z.string() }) }),
  z.object({ type: z.literal('role_changed'),     userId: z.string().uuid(), data: z.object({ groupName:      z.string(), newRole:     z.string() }) }),
]);

export function createEnqueueRouter(redisUrl: string) {
  const router = Router();
  const queue  = new Queue('notifications', {
    connection: { url: redisUrl },
    defaultJobOptions: {
      attempts:         3,
      backoff:          { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail:     50,
    },
  });

  router.post('/', async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const job = await queue.add(parsed.data.type, parsed.data);
    return res.status(202).json({ jobId: job.id });
  });

  return router;
}
