import type { Request, Response, NextFunction } from 'express';
import type Redis from 'ioredis';

const FREE_TIER_LIMIT = 3;

export function createAiUsageLimit(redis: Redis) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next(); // requireAuth handles unauthenticated requests

    const key   = `ai:usage:${userId}`;
    const count = await redis.incr(key);

    if (count > FREE_TIER_LIMIT) {
      // Undo the increment — this call is rejected
      await redis.decr(key);
      return res.status(429).json({
        error:   'free_tier_limit_reached',
        message: `You have used all ${FREE_TIER_LIMIT} free AI calls. Upgrade to continue.`,
        used:    FREE_TIER_LIMIT,
        limit:   FREE_TIER_LIMIT,
      });
    }

    // Attach remaining count to request so routes can send it in headers
    res.setHeader('X-AI-Calls-Used',      count);
    res.setHeader('X-AI-Calls-Remaining', FREE_TIER_LIMIT - count);

    next();
  };
}
