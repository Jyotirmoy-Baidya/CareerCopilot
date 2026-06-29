import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string; email: string; name: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const payload = verifyToken(auth.slice(7));
    req.user = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
