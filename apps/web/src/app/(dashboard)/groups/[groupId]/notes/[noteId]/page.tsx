import { auth } from '@/lib/auth';
import { SyncdocEditor } from '@/components/client/editor/SyncdocEditor';

interface Props {
  params: { groupId: string; noteId: string };
}

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

async function fetchNote(noteId: string) {
  try {
    const res = await fetch(`${COLLAB_URL}/notes/${noteId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: string; title: string; groupId: string }>;
  } catch {
    return null;
  }
}

export default async function NotePage({ params }: Props) {
  const session = await auth();
  if (!session) return null;

  const note = await fetchNote(params.noteId);

  return (
    <div className="h-[calc(100vh-9rem)] flex flex-col">
      <SyncdocEditor
        noteId={params.noteId}
        groupId={params.groupId}
        userRole="admin"
        noteTitle={note?.title ?? 'Untitled note'}
      />
    </div>
  );
}
