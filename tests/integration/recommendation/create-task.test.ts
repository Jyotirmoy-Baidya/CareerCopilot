import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@careercopliot/db', () => ({
  db:         { insert: vi.fn() },
  dailyTasks: {},
}));

vi.mock('@careercopliot/utils', () => ({
  isoDateString: () => '2024-06-15',
}));

import createTaskRoute from '../../../services/recommendation/src/routes/create-task';
import { db } from '@careercopliot/db';
import { signAccessToken } from '../../../services/auth/src/utils/jwt';

const mockDb = db as any;

// ── Test app ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/recommendation/tasks', createTaskRoute);

// ── Helpers ──────────────────────────────────────────────────────────────────
const validToken = signAccessToken({ sub: 'user-1', role: 'learner', email: 'a@b.com', name: 'Alice' });
const authHeader  = { Authorization: `Bearer ${validToken}` };

const createdTask = {
  id:           'task-id-1',
  userId:       'user-1',
  title:        'Learn TypeScript',
  description:  null,
  estimatedMin: 30,
  dueDate:      '2024-06-15',
  status:       'pending',
  createdAt:    new Date().toISOString(),
};

function mockInsert(task = createdTask) {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValueOnce([task]),
    }),
  });
}

describe('POST /recommendation/tasks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no Authorization header', async () => {
    const res = await request(app).post('/recommendation/tasks').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/recommendation/tasks')
      .set('Authorization', 'Bearer bad.token.here')
      .send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/recommendation/tasks')
      .set(authHeader)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/recommendation/tasks')
      .set(authHeader)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when estimatedMin exceeds 480', async () => {
    const res = await request(app)
      .post('/recommendation/tasks')
      .set(authHeader)
      .send({ title: 'Long task', estimatedMin: 500 });
    expect(res.status).toBe(400);
  });

  it('creates and returns a task with defaults', async () => {
    mockInsert();

    const res = await request(app)
      .post('/recommendation/tasks')
      .set(authHeader)
      .send({ title: 'Learn TypeScript' });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Learn TypeScript');
    expect(res.body.task.status).toBe('pending');
  });

  it('passes custom estimatedMin and dueDate to the DB', async () => {
    mockInsert({ ...createdTask, estimatedMin: 45, dueDate: '2024-07-01' });

    const res = await request(app)
      .post('/recommendation/tasks')
      .set(authHeader)
      .send({ title: 'Deep dive', estimatedMin: 45, dueDate: '2024-07-01' });

    expect(res.status).toBe(201);
    expect(res.body.task.estimatedMin).toBe(45);
    expect(res.body.task.dueDate).toBe('2024-07-01');
  });

  it('defaults dueDate to today when not provided', async () => {
    const insertSpy = mockDb.insert.mockReturnValueOnce({
      values: vi.fn(data => {
        expect(data.dueDate).toBe('2024-06-15'); // mocked isoDateString
        return { returning: vi.fn().mockResolvedValueOnce([createdTask]) };
      }),
    });

    await request(app)
      .post('/recommendation/tasks')
      .set(authHeader)
      .send({ title: 'No date task' });

    expect(insertSpy).toHaveBeenCalledOnce();
  });
});
