import { Router } from 'express';
import { z } from 'zod';
import type Redis from 'ioredis';
import { requireAuth } from '../middleware/requireAuth';
import { openRouterStream, OpenRouterError } from '../lib/openrouter';

const CHAT_LIMIT = 3;

const schema = z.object({
  messages: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  })).max(20),
  context: z.object({
    currentSkill: z.string().optional(),
    targetRole:   z.string().optional(),
    progressPct:  z.number().optional(),
  }).optional(),
});

export function createChatRouter(redis: Redis) {
  const router = Router();

  router.post('/', requireAuth, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    // Per-user chat call limit
    const userId  = req.user!.id;
    const chatKey = `ai:chat:${userId}`;
    const count   = await redis.incr(chatKey);
    if (count > CHAT_LIMIT) {
      await redis.decr(chatKey);
      return res.status(429).json({
        error:   'chat_limit_reached',
        message: `You have used all ${CHAT_LIMIT} free chat messages.`,
        used:    CHAT_LIMIT,
        limit:   CHAT_LIMIT,
      });
    }

    const { messages, context } = parsed.data;

    const systemPrompt = [
      'You are a friendly career mentor for software developers.',
      'IMPORTANT: Keep every reply to 10-20 words maximum. Be concise and direct.',
      context?.targetRole   ? `Learner targets: ${context.targetRole}.`        : '',
      context?.currentSkill ? `Currently learning: ${context.currentSkill}.`   : '',
      context?.progressPct  ? `${context.progressPct}% through roadmap.`       : '',
    ].filter(Boolean).join(' ');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Chat-Used',      count);
    res.setHeader('X-Chat-Remaining', Math.max(0, CHAT_LIMIT - count));

    try {
      await openRouterStream(
        systemPrompt,
        messages as { role: 'user' | 'assistant'; content: string }[],
        (chunk) => res.write(`data: ${JSON.stringify({ chunk })}\n\n`),
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      const msg = err instanceof OpenRouterError && err.status === 402
        ? 'out_of_credits'
        : err instanceof OpenRouterError && err.status === 429
        ? 'rate_limited'
        : 'AI service error';
      console.error('[chat] OpenRouter error:', (err as Error).message);
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    }
  });

  return router;
}
