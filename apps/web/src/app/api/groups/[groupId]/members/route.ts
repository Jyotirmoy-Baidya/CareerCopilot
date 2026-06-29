import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

export async function GET(_req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(
    `${COLLAB_URL}/groups/${params.groupId}/members?userId=${session.user.id}`,
    { cache: 'no-store' },
  ).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'Failed to fetch members' }, { status: res?.status ?? 502 });
  return NextResponse.json(await res.json());
}
