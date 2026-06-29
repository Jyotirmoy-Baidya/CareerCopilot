import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@careercopliot/db', () => ({
  db:    { query: { users: { findFirst: vi.fn() } } },
  users: {},
}));

// Bypass rate limiting in tests
vi.mock('express-rate-limit', () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
  rateLimit: () => (_req: any, _res: any, next: any) => next(),
}));

import { default as loginRoute } from '../../../services/auth/src/routes/login';
import { db } from '@careercopliot/db';
import { hashPassword } from '../../../services/auth/src/utils/password';

const mockDb = db as any;

// ── Test app ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth/login', loginRoute);

// ── Helpers ──────────────────────────────────────────────────────────────────
async function mockUser(overrides: Record<string, unknown> = {}) {
  const passwordHash = await hashPassword('correct-password');
  mockDb.query.users.findFirst.mockResolvedValueOnce({
    id:          'user-id-1',
    name:        'Alice',
    email:       'alice@example.com',
    role:        'learner',
    targetRole:  'fullstack',
    isOnboarded: true,
    passwordHash,
    ...overrides,
  });
}

describe('POST /auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for missing credentials', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for a non-existent email', async () => {
    mockDb.query.users.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).post('/auth/login').send({
      email: 'nobody@example.com', password: 'anything',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for wrong password', async () => {
    await mockUser();

    const res = await request(app).post('/auth/login').send({
      email: 'alice@example.com', password: 'wrong-password',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 200 with tokens and user on correct credentials', async () => {
    await mockUser();

    const res = await request(app).post('/auth/login').send({
      email: 'alice@example.com', password: 'correct-password',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.isOnboarded).toBe(true);
  });

  it('includes isOnboarded and targetRole in the user payload', async () => {
    await mockUser({ isOnboarded: false, targetRole: null });

    const res = await request(app).post('/auth/login').send({
      email: 'alice@example.com', password: 'correct-password',
    });
    expect(res.body.user.isOnboarded).toBe(false);
    expect(res.body.user.targetRole).toBeNull();
  });

  it('sets an httpOnly refreshToken cookie', async () => {
    await mockUser();

    const res = await request(app).post('/auth/login').send({
      email: 'alice@example.com', password: 'correct-password',
    });
    const cookies = res.headers['set-cookie'] as string[];
    expect(cookies?.some(c => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies?.some(c => c.includes('HttpOnly'))).toBe(true);
  });

  it('does not expose passwordHash', async () => {
    await mockUser();

    const res = await request(app).post('/auth/login').send({
      email: 'alice@example.com', password: 'correct-password',
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});
