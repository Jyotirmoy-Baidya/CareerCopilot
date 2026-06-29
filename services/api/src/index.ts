import 'dotenv/config';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { WebSocketServer, type WebSocket } from 'ws';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';

// ── Auth routes ───────────────────────────────────────────────────────────────
import registerRoute from './auth/routes/register';
import loginRoute    from './auth/routes/login';
import logoutRoute   from './auth/routes/logout';
import meRoute       from './auth/routes/me';
import refreshRoute  from './auth/routes/refresh';
import onboardRoute  from './auth/routes/onboard';

// ── Recommendation routes ─────────────────────────────────────────────────────
import dailyTasksRoute          from './recommendation/routes/daily-tasks';
import createTaskRoute          from './recommendation/routes/create-task';
import { createRoadmapRouter }        from './recommendation/routes/roadmap';
import { createCompleteSkillRouter }  from './recommendation/routes/complete-skill';

// ── Sync routes ───────────────────────────────────────────────────────────────
import flushRoute         from './sync/routes/flush';
import { createYjsRouter } from './sync/routes/yjs';
import versionsRoute       from './sync/routes/versions';

// ── Collaboration helpers ─────────────────────────────────────────────────────
import { verifyWsToken, parseNoteId }    from './collaboration/auth';
import { getUserRoleForNote, isYjsUpdateMessage } from './collaboration/roles';
import { addPresence, removePresence }   from './collaboration/presence';
import { db, studyGroups, groupMembers, groupNotes, DEFAULT_PERMISSIONS } from '@careercopliot/db';
import type { GroupPermissions } from '@careercopliot/db';
import { generateInviteCode } from '@careercopliot/utils';

// ── AI routes ─────────────────────────────────────────────────────────────────
import { createChatRouter }  from './ai/routes/chat';
import { createUsageRouter } from './ai/routes/usage';
import resumeRoute   from './ai/routes/resume';
import documentRoute from './ai/routes/document';
import { createQuizRouter }    from './ai/routes/quiz';
import { createSummaryRouter } from './ai/routes/summary';
import { createAiUsageLimit }  from './ai/middleware/aiUsageLimit';

// ── Notification routes + worker ──────────────────────────────────────────────
import { createEnqueueRouter }      from './notification/routes/enqueue';
import { startNotificationWorker }  from './notification/workers/notification.worker';

// ─────────────────────────────────────────────────────────────────────────────

const PORT     = parseInt(process.env.PORT ?? '4000', 10);
const WEB_URL  = process.env.WEB_URL || 'http://localhost:3000';
const redis    = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
const NOTIF_URL = `http://localhost:${PORT}`;

const app = express();

app.use(helmet());
app.use(cors({ origin: WEB_URL, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());

// ── Auth ──────────────────────────────────────────────────────────────────────
app.use('/auth/register', registerRoute);
app.use('/auth/login',    loginRoute);
app.use('/auth/logout',   logoutRoute);
app.use('/auth/me',       meRoute);
app.use('/auth/refresh',  refreshRoute);
app.use('/auth/onboard',  onboardRoute);

// ── Recommendation ────────────────────────────────────────────────────────────
app.use('/recommendation/roadmap',        createRoadmapRouter(redis));
app.use('/recommendation/daily-tasks',    dailyTasksRoute);
app.use('/recommendation/tasks',          createTaskRoute);
app.use('/recommendation/complete-skill', createCompleteSkillRouter(NOTIF_URL, redis));

// ── Sync ──────────────────────────────────────────────────────────────────────
const syncLimiter = rateLimit({ windowMs: 60_000, max: 60, message: { error: 'Too many sync requests' } });
app.use('/sync/flush',    syncLimiter, flushRoute);
app.use('/sync/yjs',      syncLimiter, createYjsRouter(`http://localhost:${PORT}`));
app.use('/sync/versions', syncLimiter, versionsRoute);

// ── AI ────────────────────────────────────────────────────────────────────────
const ipLimiter   = rateLimit({ windowMs: 60_000, max: 20, message: { error: 'Too many AI requests' } });
const usageLimit  = createAiUsageLimit(redis);
app.use('/ai/usage',          createUsageRouter(redis));
app.use('/ai/chat',           ipLimiter, createChatRouter(redis));
app.use('/ai/document',       ipLimiter, usageLimit, documentRoute);
app.use('/ai/quiz',           ipLimiter, usageLimit, createQuizRouter(redis));
app.use('/ai/resume-review',  ipLimiter, usageLimit, resumeRoute);
app.use('/ai/weekly-summary', ipLimiter, usageLimit, createSummaryRouter(redis));

// ── Notification ──────────────────────────────────────────────────────────────
app.use('/notification/enqueue', createEnqueueRouter(process.env.REDIS_URL ?? 'redis://localhost:6379'));
app.get('/notification/status',  (_req, res) => res.json({ status: 'ok', queue: 'notifications' }));

// ── Collaboration REST (groups, notes, permissions, members) ──────────────────
// Internal broadcast called by sync service to push Yjs updates to WS clients
app.post('/internal/broadcast', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const { noteId, update } = JSON.parse(req.body.toString());
    const updateBuffer = Buffer.from(update, 'base64');
    wss.clients.forEach(client => {
      const meta = clientMeta.get(client as WebSocket);
      if (meta?.noteId === noteId && (client as any).readyState === 1) {
        (client as WebSocket).send(updateBuffer);
      }
    });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'bad request' });
  }
});

app.post('/groups', async (req, res) => {
  try {
    const { name, userId } = req.body as { name?: string; userId?: string };
    if (!name?.trim() || !userId) return void res.status(400).json({ error: 'name and userId are required' });
    const [group] = await db.insert(studyGroups).values({ name: name.trim(), createdBy: userId, inviteCode: generateInviteCode(8) }).returning();
    await db.insert(groupMembers).values({ groupId: group.id, userId, role: 'admin' });
    res.status(201).json({ groupId: group.id, inviteCode: group.inviteCode });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/groups/join', async (req, res) => {
  try {
    const { inviteCode, userId } = req.body as { inviteCode?: string; userId?: string };
    if (!inviteCode?.trim() || !userId) return void res.status(400).json({ error: 'inviteCode and userId are required' });
    const code  = inviteCode.trim().toUpperCase();
    const group = await db.query.studyGroups.findFirst({ where: (g, { eq }) => eq(g.inviteCode, code) });
    if (!group) return void res.status(404).json({ error: 'Invalid invite code' });
    const existing = await db.query.groupMembers.findFirst({ where: (m, { eq, and }) => and(eq(m.groupId, group.id), eq(m.userId, userId)) });
    if (existing) return void res.status(200).json({ groupId: group.id });
    await db.insert(groupMembers).values({ groupId: group.id, userId, role: 'viewer' });
    res.status(201).json({ groupId: group.id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/groups', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return void res.status(400).json({ error: 'userId is required' });
    const memberships = await db.query.groupMembers.findMany({ where: (m, { eq }) => eq(m.userId, userId), with: { group: true } });
    res.json({ groups: memberships.map(m => ({ id: m.group.id, name: m.group.name, inviteCode: m.group.inviteCode, role: m.role, joinedAt: m.joinedAt })) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/groups/:id', async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.query.userId as string;
    if (!userId) return void res.status(400).json({ error: 'userId is required' });
    const membership = await db.query.groupMembers.findFirst({ where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)), with: { group: true } });
    if (!membership) return void res.status(404).json({ error: 'Not found' });
    const notes = await db.query.groupNotes.findMany({ where: (n, { eq }) => eq(n.groupId, groupId), columns: { id: true, title: true, createdAt: true } });
    res.json({ id: membership.group.id, name: membership.group.name, inviteCode: membership.group.inviteCode, createdBy: membership.group.createdBy, role: membership.role, notes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/groups/:id/notes', async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { title, userId } = req.body as { title?: string; userId?: string };
    if (!userId) return void res.status(400).json({ error: 'userId is required' });
    const membership = await db.query.groupMembers.findFirst({ where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)) });
    if (!membership || membership.role === 'viewer') return void res.status(403).json({ error: 'Forbidden' });
    const [note] = await db.insert(groupNotes).values({ groupId, title: title?.trim() || 'Untitled note', createdBy: userId }).returning({ id: groupNotes.id, title: groupNotes.title });
    res.status(201).json({ noteId: note.id, title: note.title });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/notes/:noteId', async (req, res) => {
  try {
    const note = await db.query.groupNotes.findFirst({ where: (n, { eq }) => eq(n.id, req.params.noteId), columns: { id: true, title: true, groupId: true } });
    if (!note) return void res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.patch('/notes/:noteId', async (req, res) => {
  try {
    const { title, userId } = req.body as { title?: string; userId?: string };
    if (!title?.trim() || !userId) return void res.status(400).json({ error: 'title and userId are required' });
    const note = await db.query.groupNotes.findFirst({ where: (n, { eq }) => eq(n.id, req.params.noteId) });
    if (!note) return void res.status(404).json({ error: 'Note not found' });
    const member = await db.query.groupMembers.findFirst({ where: (m, { eq, and }) => and(eq(m.groupId, note.groupId), eq(m.userId, userId)) });
    if (!member || member.role === 'viewer') return void res.status(403).json({ error: 'Forbidden' });
    const { eq } = await import('drizzle-orm');
    await db.update(groupNotes).set({ title: title.trim() }).where(eq(groupNotes.id, req.params.noteId));
    res.json({ title: title.trim() });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/groups/:id/permissions', async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.query.userId as string;
    if (!userId) return void res.status(400).json({ error: 'userId is required' });
    const member = await db.query.groupMembers.findFirst({ where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)) });
    if (!member) return void res.status(403).json({ error: 'Not a member' });
    const group = await db.query.studyGroups.findFirst({ where: (g, { eq }) => eq(g.id, groupId), columns: { permissions: true, createdBy: true } });
    res.json({ permissions: group?.permissions ?? DEFAULT_PERMISSIONS, isOwner: group?.createdBy === userId });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.patch('/groups/:id/permissions', async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { permissions, userId } = req.body as { permissions?: GroupPermissions; userId?: string };
    if (!userId || !permissions) return void res.status(400).json({ error: 'userId and permissions are required' });
    const group = await db.query.studyGroups.findFirst({ where: (g, { eq }) => eq(g.id, groupId), columns: { createdBy: true } });
    if (group?.createdBy !== userId) return void res.status(403).json({ error: 'Only the owner can edit permissions' });
    const { eq } = await import('drizzle-orm');
    await db.update(studyGroups).set({ permissions }).where(eq(studyGroups.id, groupId));
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/groups/:id/members', async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.query.userId as string;
    if (!userId) return void res.status(400).json({ error: 'userId is required' });
    const requester = await db.query.groupMembers.findFirst({ where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)) });
    if (!requester) return void res.status(403).json({ error: 'Not a member' });
    const group = await db.query.studyGroups.findFirst({ where: (g, { eq }) => eq(g.id, groupId), columns: { createdBy: true } });
    const members = await db.query.groupMembers.findMany({ where: (m, { eq }) => eq(m.groupId, groupId), with: { user: { columns: { id: true, name: true, email: true, avatarUrl: true } } } });
    res.json({ members: members.map(m => ({ id: m.id, userId: m.userId, role: m.role, isCreator: m.userId === group?.createdBy, joinedAt: m.joinedAt, user: m.user })) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.patch('/groups/:id/members/:memberId', async (req, res) => {
  try {
    const { id: groupId, memberId: targetMemberId } = req.params;
    const { role, userId } = req.body as { role?: string; userId?: string };
    const VALID_ROLES = ['admin', 'editor', 'viewer'] as const;
    if (!userId || !role || !VALID_ROLES.includes(role as any)) return void res.status(400).json({ error: 'userId and valid role are required' });
    const requester = await db.query.groupMembers.findFirst({ where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)) });
    if (!requester || requester.role !== 'admin') return void res.status(403).json({ error: 'Admin only' });
    const target = await db.query.groupMembers.findFirst({ where: (m, { eq }) => eq(m.id, targetMemberId) });
    if (!target || target.groupId !== groupId) return void res.status(404).json({ error: 'Member not found' });
    const group = await db.query.studyGroups.findFirst({ where: (g, { eq }) => eq(g.id, groupId), columns: { createdBy: true } });
    if (group?.createdBy === target.userId) return void res.status(403).json({ error: "Cannot change the creator's role" });
    const { eq } = await import('drizzle-orm');
    await db.update(groupMembers).set({ role: role as 'admin' | 'editor' | 'viewer' }).where(eq(groupMembers.id, targetMemberId));
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api' }));

// ── HTTP + WebSocket server ───────────────────────────────────────────────────
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });
const clientMeta = new WeakMap<WebSocket, { noteId: string; userId: string; role: string }>();

wss.on('connection', async (ws, req) => {
  const url    = req.url ?? '';
  const noteId = parseNoteId(url);
  if (!noteId) { ws.close(4000, 'Missing note ID'); return; }

  const payload = verifyWsToken(url);
  if (!payload) { ws.close(4001, 'Unauthorized'); return; }

  const role = await getUserRoleForNote(payload.sub, noteId);
  if (!role)  { ws.close(4003, 'Not a group member'); return; }

  clientMeta.set(ws, { noteId, userId: payload.sub, role });
  await addPresence(redis, noteId, payload.sub);

  if (role === 'viewer') {
    const originalOn = ws.on.bind(ws);
    ws.on = (event: string, listener: any) => {
      if (event === 'message') {
        return originalOn(event, (data: Buffer, isBinary: boolean) => {
          if (isYjsUpdateMessage(data)) return;
          listener(data, isBinary);
        });
      }
      return originalOn(event, listener);
    };
  }

  ws.on('close', async () => {
    const meta = clientMeta.get(ws);
    if (meta) await removePresence(redis, meta.noteId, meta.userId);
  });

  setupWSConnection(ws, req, { docName: `note-${noteId}` });
});

// ── Start ─────────────────────────────────────────────────────────────────────
startNotificationWorker(process.env.REDIS_URL ?? 'redis://localhost:6379');

server.listen(PORT, () => {
  console.log(`API service running on port ${PORT}`);
});
