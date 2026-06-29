import { Router } from 'express';
import type Redis from 'ioredis';
import { requireAuth } from '../middleware/requireAuth';

const DOC_LIMIT  = 3;
const CHAT_LIMIT = 3;

export function createUsageRouter(redis: Redis) {
  const router = Router();

  router.get('/', requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const [docRaw, chatRaw] = await Promise.all([
      redis.get(`ai:usage:${userId}`),
      redis.get(`ai:chat:${userId}`),
    ]);
    res.json({
      doc:  { used: parseInt(docRaw  ?? '0'), limit: DOC_LIMIT },
      chat: { used: parseInt(chatRaw ?? '0'), limit: CHAT_LIMIT },
    });
  });

  return router;
}
