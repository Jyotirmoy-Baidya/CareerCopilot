import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { JWTPayload } from '@careercopliot/types';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string; email: string; name: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as JWTPayload;
    req.user = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
