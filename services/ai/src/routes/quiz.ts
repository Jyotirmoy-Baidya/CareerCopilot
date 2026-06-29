import { Router } from 'express';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type Redis from 'ioredis';
import { requireAuth } from '../middleware/requireAuth';

const schema = z.object({
  skillSlug:  z.string().max(100),
  skillName:  z.string().max(255),
  level:      z.enum(['beginner', 'intermediate', 'advanced']).optional(),
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
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: `Generate exactly 5 multiple choice questions about "${skillName}" at ${level} level.
Return ONLY valid JSON in this format:
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
      });

      // Extract JSON from the response — Gemini sometimes wraps it in markdown
      const jsonMatch = text.match(/\{[\s\S]+\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const quiz = JSON.parse(jsonMatch[0]);
      await redis.set(cacheKey, JSON.stringify(quiz), 'EX', 86400); // cache for 24 hours
      return res.json(quiz);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to generate quiz' });
    }
  });

  return router;
}
