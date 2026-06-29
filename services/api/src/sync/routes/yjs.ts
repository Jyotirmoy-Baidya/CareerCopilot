import { Router } from 'express';
import { z } from 'zod';
import * as Y from 'yjs';
import { db } from '@careercopliot/db';
import { groupNotes, groupMembers, syncOps } from '@careercopliot/db';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const schema = z.object({
  noteId: z.string().uuid(),
  update: z.string(), // base64-encoded Yjs binary update
});

export function createYjsRouter(collaborationUrl: string) {
  router.post('/', requireAuth, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { noteId, update } = parsed.data;
    const userId = req.user!.id;

    // Decode the incoming Yjs binary
    const updateBuffer = Buffer.from(update, 'base64');
    if (updateBuffer.byteLength > 512 * 1024) {
      return res.status(413).json({ error: 'Yjs update too large' });
    }

    // Verify the user is a member with write access
    const note = await db.query.groupNotes.findFirst({ where: eq(groupNotes.id, noteId) });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const member = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, note.groupId), eq(groupMembers.userId, userId)),
    });
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot write to notes' });
    }

    // Merge the incoming update into the stored Yjs document
    const serverDoc = new Y.Doc();
    if (note.yjsState) {
      Y.applyUpdate(serverDoc, note.yjsState as unknown as Uint8Array);
    }
    Y.applyUpdate(serverDoc, updateBuffer);
    const newState = Buffer.from(Y.encodeStateAsUpdate(serverDoc));

    await db
      .update(groupNotes)
      .set({ yjsState: newState as any, updatedAt: new Date() })
      .where(eq(groupNotes.id, noteId));

    await db.insert(syncOps).values({ noteId, userId, opType: 'yjs_update', byteSize: updateBuffer.byteLength });

    // Notify collaboration service so live WebSocket users receive the merged update
    fetch(`${collaborationUrl}/internal/broadcast`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ noteId, update }),
    }).catch(() => {/* live sync is best-effort */});

    return res.json({ ok: true });
  });

  return router;
}
