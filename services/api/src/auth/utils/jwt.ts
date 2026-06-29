import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@careercopliot/types';

const SECRET = process.env.JWT_SECRET!;

export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, SECRET) as JWTPayload;
}
