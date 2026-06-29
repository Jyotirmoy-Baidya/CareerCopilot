import { Router } from 'express';
import { z } from 'zod';
import { db } from '@careercopliot/db';
import { users } from '@careercopliot/db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

const router = Router();

const schema = z.object({
  name:     z.string().min(2).max(255),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning();

  const accessToken  = signAccessToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
  const refreshToken = signRefreshToken(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return res.status(201).json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export default router;
