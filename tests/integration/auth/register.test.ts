import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// ── DB mock ─────────────────────────────────────────────────────────────────
vi.mock('@careercopliot/db', () => {
  const mockDb = {
    query: { users: { findFirst: vi.fn() } },
    insert: vi.fn(),
  };
  return { db: mockDb, users: {} };
});

import registerRoute from '../../../services/auth/src/routes/register';
import { db } from '@careercopliot/db';

const mockDb = db as any;

// ── Test app ────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth/register', registerRoute);

// ── Helpers ─────────────────────────────────────────────────────────────────
const validBody = { name: 'Alice', email: 'alice@example.com', password: 'password123' };

function mockNewUser(overrides = {}) {
  mockDb.query.users.findFirst.mockResolvedValueOnce(null);
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValueOnce([{
        id: 'new-user-id',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'learner',
        ...overrides,
      }]),
    }),
  });
}

describe('POST /auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/auth/register').send({ ...validBody, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/auth/register').send({ ...validBody, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is too short', async () => {
    const res = await request(app).post('/auth/register').send({ ...validBody, name: 'A' });
    expect(res.status).toBe(400);
  });

  it('returns 409 when email is already registered', async () => {
    mockDb.query.users.findFirst.mockResolvedValueOnce({ id: 'existing' });

    const res = await request(app).post('/auth/register').send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });

  it('returns 201 with accessToken and user on success', async () => {
    mockNewUser();

    const res = await request(app).post('/auth/register').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('learner');
  });

  it('does not expose passwordHash in the response', async () => {
    mockNewUser();

    const res = await request(app).post('/auth/register').send(validBody);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('sets a refreshToken httpOnly cookie on success', async () => {
    mockNewUser();

    const res = await request(app).post('/auth/register').send(validBody);
    const cookies = res.headers['set-cookie'] as string[];
    expect(cookies?.some(c => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies?.some(c => c.includes('HttpOnly'))).toBe(true);
  });
});
