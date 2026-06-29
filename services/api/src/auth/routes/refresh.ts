import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '@careercopliot/db';
import { users } from '@careercopliot/db';
import { eq } from 'drizzle-orm';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

const router = Router();

router.post('/', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; type: string };
    if (payload.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.sub) });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken      = signAccessToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
    const newRefreshToken  = signRefreshToken(user.id);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export default router;
