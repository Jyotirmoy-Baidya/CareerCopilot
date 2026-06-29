import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';
import { GroupsClient } from './GroupsClient';

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

async function fetchMyGroups(userId: string) {
  try {
    const res = await fetch(`${COLLAB_URL}/groups?userId=${userId}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.groups ?? [];
  } catch {
    return [];
  }
}

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const groups = await fetchMyGroups(session.user.id as string);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Study groups</h1>
        <Link
          href="/groups/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white text-sm rounded-md hover:bg-brand-600"
        >
          <Plus className="w-4 h-4" />
          New group
        </Link>
      </div>

      {groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g: { id: string; name: string; inviteCode: string; role: string }) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="bg-white rounded-xl border p-5 hover:shadow-sm transition flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{g.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono tracking-widest">{g.inviteCode}</p>
              </div>
              <span className="text-xs text-gray-500 capitalize">{g.role}</span>
            </Link>
          ))}
        </div>
      )}

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">No groups yet</p>
          <p className="text-gray-400 text-sm mt-1">Create one or join with an invite code.</p>
        </div>
      )}

      <div className="border-t pt-6">
        <h2 className="text-sm font-medium text-gray-600 mb-3">Join with an invite code</h2>
        <GroupsClient />
      </div>
    </div>
  );
}
