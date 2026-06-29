import crypto from 'crypto';

export function mintServiceToken(user: {
  id:     string;
  email?: string | null;
  name?:  string | null;
  role?:  string;
}): string {
  const secret = process.env.JWT_SECRET!;
  const now    = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body   = Buffer.from(JSON.stringify({
    sub:   user.id,
    email: user.email ?? '',
    name:  user.name  ?? '',
    role:  user.role  ?? 'learner',
    iat:   now,
    exp:   now + 60,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}
