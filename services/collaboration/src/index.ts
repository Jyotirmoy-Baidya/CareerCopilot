import 'dotenv/config';
import http from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import Redis from 'ioredis';
// @ts-ignore — y-websocket ships CJS with no types; it works at runtime
import { setupWSConnection } from 'y-websocket/bin/utils';
import { verifyWsToken, parseNoteId } from './auth';
import { getUserRoleForNote, isYjsUpdateMessage } from './roles';
import { addPresence, removePresence } from './presence';
import { db, studyGroups, groupMembers, groupNotes, DEFAULT_PERMISSIONS } from '@careercopliot/db';
import type { GroupPermissions } from '@careercopliot/db';
import { generateInviteCode } from '@careercopliot/utils';

const PORT  = parseInt(process.env.COLLABORATION_SERVICE_PORT ?? '4004', 10);
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end',  () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  const payload = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

// Use a plain HTTP server so we can handle both WS upgrade requests
// and REST endpoints on the same port without needing Express
const server = http.createServer(async (req, res) => {
  const url = req.url ?? '';

  if (req.method === 'GET' && url === '/health') {
    return json(res, 200, { status: 'ok', service: 'collaboration' });
  }

  // POST /groups — create a study group
  if (req.method === 'POST' && url === '/groups') {
    try {
      const body  = await readBody(req);
      const { name, userId } = JSON.parse(body) as { name?: string; userId?: string };
      if (!name?.trim() || !userId) return json(res, 400, { error: 'name and userId are required' });

      const [group] = await db.insert(studyGroups).values({
        name:       name.trim(),
        createdBy:  userId,
        inviteCode: generateInviteCode(8),
      }).returning();

      await db.insert(groupMembers).values({ groupId: group.id, userId, role: 'admin' });

      return json(res, 201, { groupId: group.id, inviteCode: group.inviteCode });
    } catch (err) {
      console.error('POST /groups error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // POST /groups/join — join by invite code
  if (req.method === 'POST' && url === '/groups/join') {
    try {
      const body  = await readBody(req);
      const { inviteCode, userId } = JSON.parse(body) as { inviteCode?: string; userId?: string };
      if (!inviteCode?.trim() || !userId) return json(res, 400, { error: 'inviteCode and userId are required' });

      const code  = inviteCode.trim().toUpperCase();
      const group = await db.query.studyGroups.findFirst({
        where: (g, { eq }) => eq(g.inviteCode, code),
      });
      if (!group) return json(res, 404, { error: 'Invalid invite code' });

      const existing = await db.query.groupMembers.findFirst({
        where: (m, { eq, and }) => and(eq(m.groupId, group.id), eq(m.userId, userId)),
      });
      if (existing) return json(res, 200, { groupId: group.id });

      await db.insert(groupMembers).values({ groupId: group.id, userId, role: 'viewer' });

      // Fire email notification (fire-and-forget)
      const NOTIF_URL = process.env.NOTIFICATION_SERVICE_URL;
      if (NOTIF_URL) {
        fetch(`${NOTIF_URL}/notification/enqueue`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            type:   'group_joined',
            userId,
            data:   { groupName: group.name, inviteCode: group.inviteCode },
          }),
        }).catch(() => {});
      }

      return json(res, 201, { groupId: group.id });
    } catch (err) {
      console.error('POST /groups/join error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // GET /groups?userId=<id> — list groups for a user
  if (req.method === 'GET' && url.startsWith('/groups?')) {
    try {
      const userId = new URL(url, 'http://x').searchParams.get('userId');
      if (!userId) return json(res, 400, { error: 'userId is required' });

      const memberships = await db.query.groupMembers.findMany({
        where: (m, { eq }) => eq(m.userId, userId),
        with:  { group: true },
      });

      return json(res, 200, {
        groups: memberships.map(m => ({
          id:         m.group.id,
          name:       m.group.name,
          inviteCode: m.group.inviteCode,
          role:       m.role,
          joinedAt:   m.joinedAt,
        })),
      });
    } catch (err) {
      console.error('GET /groups error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // GET /groups/:id?userId=<id> — single group with notes (must not match /groups/:id/*)
  const groupDetailMatch = url.match(/^\/groups\/([^/?]+)(?:\?|$)/);
  if (req.method === 'GET' && groupDetailMatch) {
    try {
      const groupId = groupDetailMatch[1];
      const parsed  = new URL(url, 'http://x');
      const userId  = parsed.searchParams.get('userId');
      if (!userId) return json(res, 400, { error: 'userId is required' });

      const membership = await db.query.groupMembers.findFirst({
        where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)),
        with:  { group: true },
      });
      if (!membership) return json(res, 404, { error: 'Not found' });

      const notes = await db.query.groupNotes.findMany({
        where:   (n, { eq }) => eq(n.groupId, groupId),
        columns: { id: true, title: true, createdAt: true },
      });

      return json(res, 200, {
        id:         membership.group.id,
        name:       membership.group.name,
        inviteCode: membership.group.inviteCode,
        createdBy:  membership.group.createdBy,
        role:       membership.role,
        notes,
      });
    } catch (err) {
      console.error('GET /groups/:id error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // POST /groups/:id/notes — create a note in a group
  const noteCreateMatch = url.match(/^\/groups\/([^/]+)\/notes$/);
  if (req.method === 'POST' && noteCreateMatch) {
    try {
      const groupId = noteCreateMatch[1];
      const body    = await readBody(req);
      const { title, userId } = JSON.parse(body) as { title?: string; userId?: string };
      if (!userId) return json(res, 400, { error: 'userId is required' });

      const membership = await db.query.groupMembers.findFirst({
        where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)),
      });
      if (!membership || membership.role === 'viewer') return json(res, 403, { error: 'Forbidden' });

      const [note] = await db.insert(groupNotes).values({
        groupId,
        title:     title?.trim() || 'Untitled note',
        createdBy: userId,
      }).returning({ id: groupNotes.id, title: groupNotes.title });

      return json(res, 201, { noteId: note.id, title: note.title });
    } catch (err) {
      console.error('POST /groups/:id/notes error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // GET /notes/:noteId — fetch note metadata (title)
  const noteGetMatch = url.match(/^\/notes\/([^/?]+)$/);
  if (req.method === 'GET' && noteGetMatch) {
    try {
      const noteId = noteGetMatch[1];
      const note   = await db.query.groupNotes.findFirst({
        where:   (n, { eq }) => eq(n.id, noteId),
        columns: { id: true, title: true, groupId: true },
      });
      if (!note) return json(res, 404, { error: 'Note not found' });
      return json(res, 200, note);
    } catch (err) {
      console.error('GET /notes/:id error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // PATCH /notes/:noteId — rename a note
  const notePatchMatch = url.match(/^\/notes\/([^/?]+)$/);
  if (req.method === 'PATCH' && notePatchMatch) {
    try {
      const noteId = notePatchMatch[1];
      const body   = await readBody(req);
      const { title, userId } = JSON.parse(body) as { title?: string; userId?: string };
      if (!title?.trim() || !userId) return json(res, 400, { error: 'title and userId are required' });

      const note = await db.query.groupNotes.findFirst({
        where: (n, { eq }) => eq(n.id, noteId),
      });
      if (!note) return json(res, 404, { error: 'Note not found' });

      const member = await db.query.groupMembers.findFirst({
        where: (m, { eq, and }) => and(eq(m.groupId, note.groupId), eq(m.userId, userId)),
      });
      if (!member || member.role === 'viewer') return json(res, 403, { error: 'Forbidden' });

      const { eq: eqFn } = await import('drizzle-orm');
      await db.update(groupNotes).set({ title: title.trim() }).where(eqFn(groupNotes.id, noteId));
      return json(res, 200, { title: title.trim() });
    } catch (err) {
      console.error('PATCH /notes/:id error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // GET /groups/:id/permissions?userId=<id>
  const permGetMatch = url.match(/^\/groups\/([^/?]+)\/permissions/);
  if (req.method === 'GET' && permGetMatch) {
    try {
      const groupId = permGetMatch[1];
      const userId  = new URL(url, 'http://x').searchParams.get('userId');
      if (!userId) return json(res, 400, { error: 'userId is required' });

      const member = await db.query.groupMembers.findFirst({
        where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)),
      });
      if (!member) return json(res, 403, { error: 'Not a member' });

      const group = await db.query.studyGroups.findFirst({
        where:   (g, { eq }) => eq(g.id, groupId),
        columns: { permissions: true, createdBy: true },
      });

      return json(res, 200, {
        permissions: group?.permissions ?? DEFAULT_PERMISSIONS,
        isOwner:     group?.createdBy === userId,
      });
    } catch (err) {
      console.error('GET /groups/:id/permissions error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // PATCH /groups/:id/permissions — owner-only
  if (req.method === 'PATCH' && permGetMatch) {
    try {
      const groupId = permGetMatch[1];
      const body    = await readBody(req);
      const { permissions, userId } = JSON.parse(body) as { permissions?: GroupPermissions; userId?: string };
      if (!userId || !permissions) return json(res, 400, { error: 'userId and permissions are required' });

      const group = await db.query.studyGroups.findFirst({
        where:   (g, { eq }) => eq(g.id, groupId),
        columns: { createdBy: true },
      });
      if (group?.createdBy !== userId) return json(res, 403, { error: 'Only the owner can edit permissions' });

      const { eq: eqFn } = await import('drizzle-orm');
      await db.update(studyGroups).set({ permissions }).where(eqFn(studyGroups.id, groupId));
      return json(res, 200, { ok: true });
    } catch (err) {
      console.error('PATCH /groups/:id/permissions error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // GET /groups/:id/members?userId=<id> — list all members with user info
  const membersGetMatch = url.match(/^\/groups\/([^/?]+)\/members/);
  if (req.method === 'GET' && membersGetMatch) {
    try {
      const groupId = membersGetMatch[1];
      const parsed  = new URL(url, 'http://x');
      const userId  = parsed.searchParams.get('userId');
      if (!userId) return json(res, 400, { error: 'userId is required' });

      // Requester must be a member
      const requester = await db.query.groupMembers.findFirst({
        where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)),
      });
      if (!requester) return json(res, 403, { error: 'Not a member' });

      const group = await db.query.studyGroups.findFirst({
        where: (g, { eq }) => eq(g.id, groupId),
        columns: { createdBy: true },
      });

      const members = await db.query.groupMembers.findMany({
        where: (m, { eq }) => eq(m.groupId, groupId),
        with:  { user: { columns: { id: true, name: true, email: true, avatarUrl: true } } },
      });

      return json(res, 200, {
        members: members.map(m => ({
          id:        m.id,
          userId:    m.userId,
          role:      m.role,
          isCreator: m.userId === group?.createdBy,
          joinedAt:  m.joinedAt,
          user: {
            id:        m.user.id,
            name:      m.user.name,
            email:     m.user.email,
            avatarUrl: m.user.avatarUrl,
          },
        })),
      });
    } catch (err) {
      console.error('GET /groups/:id/members error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // PATCH /groups/:id/members/:memberId — change a member's role (admin only)
  const memberPatchMatch = url.match(/^\/groups\/([^/?]+)\/members\/([^/?]+)$/);
  if (req.method === 'PATCH' && memberPatchMatch) {
    try {
      const groupId        = memberPatchMatch[1];
      const targetMemberId = memberPatchMatch[2];
      const body           = await readBody(req);
      const { role, userId } = JSON.parse(body) as { role?: string; userId?: string };

      const VALID_ROLES = ['admin', 'editor', 'viewer'] as const;
      if (!userId || !role || !VALID_ROLES.includes(role as any)) {
        return json(res, 400, { error: 'userId and valid role are required' });
      }

      // Requester must be admin
      const requester = await db.query.groupMembers.findFirst({
        where: (m, { eq, and }) => and(eq(m.groupId, groupId), eq(m.userId, userId)),
      });
      if (!requester || requester.role !== 'admin') return json(res, 403, { error: 'Admin only' });

      // Target member must exist in this group
      const target = await db.query.groupMembers.findFirst({
        where: (m, { eq }) => eq(m.id, targetMemberId),
      });
      if (!target || target.groupId !== groupId) return json(res, 404, { error: 'Member not found' });

      // Creator cannot be demoted
      const group = await db.query.studyGroups.findFirst({
        where:   (g, { eq }) => eq(g.id, groupId),
        columns: { createdBy: true, name: true },
      });
      if (group?.createdBy === target.userId) return json(res, 403, { error: 'Cannot change the creator\'s role' });

      const { eq: eqFn } = await import('drizzle-orm');
      await db.update(groupMembers)
        .set({ role: role as 'admin' | 'editor' | 'viewer' })
        .where(eqFn(groupMembers.id, targetMemberId));

      // Fire email notification (fire-and-forget)
      const NOTIF_URL = process.env.NOTIFICATION_SERVICE_URL;
      if (NOTIF_URL) {
        fetch(`${NOTIF_URL}/notification/enqueue`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            type:   'role_changed',
            userId: target.userId,
            data:   { groupName: group?.name ?? groupId, newRole: role },
          }),
        }).catch(() => {});
      }

      return json(res, 200, { ok: true });
    } catch (err) {
      console.error('PATCH /groups/:id/members/:id error:', err);
      return json(res, 500, { error: 'Internal server error' });
    }
  }

  // Internal broadcast endpoint — called by sync service after merging offline Yjs update
  if (req.method === 'POST' && url === '/internal/broadcast') {
    try {
      const body = await readBody(req);
      const { noteId, update } = JSON.parse(body) as { noteId: string; update: string };
      const updateBuffer = Buffer.from(update, 'base64');

      wss.clients.forEach(client => {
        const meta = clientMeta.get(client);
        if (meta?.noteId === noteId && client.readyState === 1 /* OPEN */) {
          client.send(updateBuffer);
        }
      });

      res.writeHead(200);
      res.end('ok');
    } catch {
      res.writeHead(400);
      res.end('bad request');
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

// Track per-connection metadata so we can clean up presence on close
const clientMeta = new WeakMap<WebSocket, { noteId: string; userId: string; role: string }>();

wss.on('connection', async (ws, req) => {
  const url = req.url ?? '';

  const noteId = parseNoteId(url);
  if (!noteId) { ws.close(4000, 'Missing note ID'); return; }

  const payload = verifyWsToken(url);
  if (!payload) { ws.close(4001, 'Unauthorized'); return; }

  const role = await getUserRoleForNote(payload.sub, noteId);
  if (!role) { ws.close(4003, 'Not a group member'); return; }

  clientMeta.set(ws, { noteId, userId: payload.sub, role });
  await addPresence(redis, noteId, payload.sub);

  // For viewers: intercept their messages and drop Yjs document updates.
  // They can still receive updates and participate in the sync handshake.
  if (role === 'viewer') {
    const originalSend = ws.send.bind(ws);
    const originalOn   = ws.on.bind(ws);

    ws.on = (event: string, listener: any) => {
      if (event === 'message') {
        return originalOn(event, (data: Buffer, isBinary: boolean) => {
          if (isYjsUpdateMessage(data)) return; // drop — viewers cannot push edits
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

  // Hand off to y-websocket's built-in sync protocol handler
  setupWSConnection(ws, req, { docName: `note-${noteId}` });
});

server.listen(PORT, () => {
  console.log(`Collaboration service running on port ${PORT}`);
});
