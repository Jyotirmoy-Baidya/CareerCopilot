import { db } from '@careercopliot/db';
import { groupNotes, groupMembers } from '@careercopliot/db';
import { eq, and } from 'drizzle-orm';

// Resolve a user's role in the group that owns a given note.
// Returns null if the user is not a member.
export async function getUserRoleForNote(userId: string, noteId: string): Promise<'admin' | 'editor' | 'viewer' | null> {
  const note = await db.query.groupNotes.findFirst({ where: eq(groupNotes.id, noteId) });
  if (!note) return null;

  const member = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, note.groupId), eq(groupMembers.userId, userId)),
  });

  return (member?.role ?? null) as 'admin' | 'editor' | 'viewer' | null;
}

// y-websocket message byte 0 encodes the message type:
//   0 = sync step 1 (state vector exchange — allowed for everyone)
//   1 = sync step 2 / update message — viewers must be blocked here
export function isYjsUpdateMessage(data: Buffer): boolean {
  return data.length > 0 && data[0] === 1;
}
