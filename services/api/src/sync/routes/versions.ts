import { Router } from 'express';
import { db, noteVersions, groupNotes, groupMembers } from '@careercopliot/db';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@careercopliot/types';
import { Queue } from 'bullmq';

const router = Router();

// Lazily created queue — only used when REDIS_URL is set
let notifQueue: Queue | null = null;
function getQueue(): Queue | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!notifQueue) {
    notifQueue = new Queue('notifications', {
      connection: { url },
      defaultJobOptions: {
        attempts:         3,
        backoff:          { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail:     50,
      },
    });
  }
  return notifQueue;
}

function getUserId(req: any): string | null {
  const auth  = req.headers['authorization'] ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return payload.sub;
  } catch {
    return null;
  }
}

// GET /sync/versions?noteId=<id>
router.get('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const noteId = req.query.noteId as string;
  if (!noteId) return res.status(400).json({ error: 'Missing noteId' });

  const versions = await db.query.noteVersions.findMany({
    where:   (v, { eq })   => eq(v.noteId, noteId),
    orderBy: (v, { desc }) => [desc(v.createdAt)],
    limit:   50,
  }).catch(() => []);

  const creatorIds = [...new Set(versions.map(v => v.createdBy))];
  const creators   = creatorIds.length
    ? await db.query.users.findMany({
        where:   (u, { inArray }) => inArray(u.id, creatorIds),
        columns: { id: true, name: true },
      }).catch(() => [])
    : [];
  const nameById = Object.fromEntries(creators.map(u => [u.id, u.name]));

  return res.json({
    versions: versions.map(v => ({
      id:            v.id,
      label:         v.label,
      createdAt:     v.createdAt.toISOString(),
      createdByName: nameById[v.createdBy] ?? 'Unknown',
    })),
  });
});

// POST /sync/versions
router.post('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { noteId, snapshot, label, html, noteTitle } = req.body;
  if (!noteId || !snapshot) return res.status(400).json({ error: 'Missing fields' });

  const note = await db.query.groupNotes.findFirst({
    where: (n, { eq }) => eq(n.id, noteId),
  }).catch(() => null);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const member = await db.query.groupMembers.findFirst({
    where: (m, { eq, and }) => and(eq(m.groupId, note.groupId), eq(m.userId, userId)),
  }).catch(() => null);
  if (!member) return res.status(403).json({ error: 'Forbidden' });

  const versionLabel = label ?? `Snapshot ${new Date().toLocaleString()}`;

  const [version] = await db.insert(noteVersions).values({
    noteId,
    yjsSnapshot: Buffer.from(snapshot, 'base64') as any,
    htmlContent: typeof html === 'string' && html ? html : null,
    label:       versionLabel,
    createdBy:   userId,
  }).returning();

  // Enqueue notification job (persisted in Redis until worker picks it up)
  const queue = getQueue();
  if (queue && version) {
    try {
      const [group, creator] = await Promise.all([
        db.query.studyGroups.findFirst({
          where:   (g, { eq }) => eq(g.id, note.groupId),
          columns: { id: true, name: true, createdBy: true },
        }).catch(() => null),
        db.query.users.findFirst({
          where:   (u, { eq }) => eq(u.id, userId),
          columns: { id: true, name: true },
        }).catch(() => null),
      ]);

      if (group) {
        await queue.add('note_version_saved', {
          type:   'note_version_saved',
          userId: group.createdBy,          // owner receives the email
          data: {
            noteTitle:     noteTitle ?? note.title ?? 'Untitled',
            groupName:     group.name,
            versionLabel,
            createdByName: creator?.name ?? 'A collaborator',
            createdAt:     version.createdAt.toISOString(),
            htmlContent:   typeof html === 'string' ? html : '',
          },
        });
      }
    } catch (err) {
      console.error('[versions] Failed to enqueue notification:', (err as Error).message);
    }
  }

  return res.status(201).json({ ok: true });
});

// GET /sync/versions/:id/snapshot
router.get('/:id/snapshot', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const version = await db.query.noteVersions.findFirst({
    where: (v, { eq }) => eq(v.id, req.params.id),
  }).catch(() => null);

  if (!version) return res.status(404).json({ error: 'Version not found' });

  return res.json({
    snapshot: Buffer.from(version.yjsSnapshot).toString('base64'),
  });
});

export default router;
