import { Router } from 'express';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type Redis from 'ioredis';
import { requireAuth } from '../middleware/requireAuth';

const schema = z.object({
  tasksCompleted: z.number().min(0),
  streakDays:     z.number().min(0),
  progressPct:    z.number().min(0).max(100),
  targetRole:     z.string().max(100),
});

export function createSummaryRouter(redis: Redis) {
  const router = Router();

  router.post('/', requireAuth, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { tasksCompleted, streakDays, progressPct, targetRole } = parsed.data;
    const userId   = req.user!.id;
    const today    = new Date().toISOString().split('T')[0];
    const cacheKey = `ai:summary:${userId}:${today}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    try {
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: `Write a short, warm weekly progress summary for a learner targeting ${targetRole}.
Facts: ${tasksCompleted} tasks completed this week, ${streakDays} day streak, ${progressPct}% through their roadmap.
Keep it under 100 words. Be specific to the numbers. Be encouraging but honest.`,
      });

      const result = { summary: text.trim() };
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400);
      return res.json(result);
    } catch {
      return res.status(500).json({ error: 'Summary generation failed' });
    }
  });

  return router;
}
