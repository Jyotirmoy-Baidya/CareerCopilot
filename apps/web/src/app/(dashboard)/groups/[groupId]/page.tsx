import { auth } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, FilePlus } from 'lucide-react';
import { GroupNotesClient } from './GroupNotesClient';
import { MembersSection } from './MembersSection';
import { GroupStoreProvider } from './GroupStoreProvider';

interface Props {
  params: { groupId: string };
}

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

async function fetchGroup(groupId: string, userId: string) {
  try {
    const url = `${COLLAB_URL}/groups/${groupId}?userId=${userId}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`fetchGroup: ${url} → ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`fetchGroup: collaboration service unreachable at ${COLLAB_URL}:`, err);
    return null;
  }
}

export default async function GroupPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id as string;
  const group  = await fetchGroup(params.groupId, userId);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-gray-500">Group not found or you are not a member.</p>
        <Link href="/groups" className="text-sm text-brand-500 hover:underline">
          Back to groups
        </Link>
      </div>
    );
  }

  const isOwner  = group.createdBy === userId;
  const userRole = group.role as 'admin' | 'editor' | 'viewer';

  return (
    <>
      {/* Populate the group store for all client children */}
      <GroupStoreProvider
        groupId={params.groupId}
        groupName={group.name}
        inviteCode={group.inviteCode}
        userRole={userRole}
        isOwner={isOwner}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/groups" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Invite code:&nbsp;
              <span className="font-mono tracking-widest text-gray-600">{group.inviteCode}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Shared notes</h2>
            {/* GroupNotesClient reads role from store — no prop needed */}
            <GroupNotesClient groupId={params.groupId} inviteCode={group.inviteCode} />
          </div>

          {(!group.notes || group.notes.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FilePlus className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No notes yet.</p>
              <p className="text-gray-400 text-sm mt-1">Create a note to start collaborating.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {group.notes.map((note: { id: string; title: string }) => (
                <li key={note.id}>
                  <Link
                    href={`/groups/${params.groupId}/notes/${note.id}`}
                    className="flex items-center gap-3 py-3 px-1 hover:bg-gray-50 rounded-lg transition"
                  >
                    <FilePlus className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-800">{note.title || 'Untitled note'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* MembersSection reads everything from the group store */}
        <MembersSection groupId={params.groupId} />
      </div>
    </>
  );
}
