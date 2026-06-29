import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title } = await req.json();

  const res = await fetch(`${COLLAB_URL}/groups/${params.groupId}/notes`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ title, userId: session.user.id }),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'Could not create note' }, { status: res?.status ?? 502 });
  return NextResponse.json(await res.json(), { status: 201 });
}
