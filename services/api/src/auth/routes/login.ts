import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { users } from '@careercopliot/db';
import { eq } from 'drizzle-orm';
import { comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts — try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

router.post('/', loginLimiter, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !user.passwordHash) {
    // Same response whether email exists or not — prevent user enumeration
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken  = signAccessToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
  const refreshToken = signRefreshToken(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id:          user.id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      targetRole:  user.targetRole,
      isOnboarded: user.isOnboarded,
    },
  });
});

export default router;
