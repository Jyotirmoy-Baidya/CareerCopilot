import { Router } from 'express';
import { z } from 'zod';
import type Redis from 'ioredis';
import { requireAuth } from '../middleware/requireAuth';
import { openRouterText } from '../lib/openrouter';

const schema = z.object({
  skillSlug: z.string().max(100),
  skillName: z.string().max(255),
  level:     z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export function createQuizRouter(redis: Redis) {
  const router = Router();

  router.post('/', requireAuth, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { skillSlug, skillName, level = 'beginner' } = parsed.data;
    const cacheKey = `ai:quiz:${skillSlug}:${level}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    try {
      const text = await openRouterText(
        `Generate exactly 5 multiple choice questions about "${skillName}" at ${level} level.
Return ONLY valid JSON with no markdown or explanation:
{
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "explanation": "..."
    }
  ]
}`,
        { temperature: 0.5 },
      );

      const jsonMatch = text.match(/\{[\s\S]+\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const quiz = JSON.parse(jsonMatch[0]);
      await redis.set(cacheKey, JSON.stringify(quiz), 'EX', 86400);
      return res.json(quiz);
    } catch (err) {
      console.error('[quiz] OpenRouter error:', (err as Error).message);
      return res.status(500).json({ error: 'Failed to generate quiz' });
    }
  });

  return router;
}
