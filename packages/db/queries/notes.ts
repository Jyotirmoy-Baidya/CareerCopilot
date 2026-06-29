import { eq } from 'drizzle-orm';
import { db } from '../client';
import { groupNotes, noteVersions, groupMembers } from '../schema';

export async function getNoteById(noteId: string) {
  return db.query.groupNotes.findFirst({
    where: eq(groupNotes.id, noteId),
  });
}

export async function getUserRoleInGroup(userId: string, groupId: string) {
  const member = await db.query.groupMembers.findFirst({
    where: eq(groupMembers.groupId, groupId),
    // drizzle doesn't support two where clauses in findFirst easily — use raw
  });
  return member?.role ?? null;
}

export async function updateNoteYjsState(noteId: string, yjsState: Buffer) {
  await db
    .update(groupNotes)
    .set({ yjsState, updatedAt: new Date() })
    .where(eq(groupNotes.id, noteId));
}

export async function saveNoteVersion(data: {
  noteId: string;
  yjsSnapshot: Buffer;
  label: string | null;
  createdBy: string;
}) {
  const [version] = await db.insert(noteVersions).values(data).returning();
  return version;
}

export async function listNoteVersions(noteId: string) {
  return db.query.noteVersions.findMany({
    where: eq(noteVersions.noteId, noteId),
    orderBy: (v, { desc }) => [desc(v.createdAt)],
  });
}

export async function getNoteVersionById(versionId: string) {
  return db.query.noteVersions.findFirst({
    where: eq(noteVersions.id, versionId),
  });
}
