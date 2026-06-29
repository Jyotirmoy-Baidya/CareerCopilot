import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${COLLAB_URL}/groups?userId=${session.user.id}`).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: 'Could not fetch groups' }, { status: 502 });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Group name is required' }, { status: 400 });

  const res = await fetch(`${COLLAB_URL}/groups`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, userId: session.user.id }),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'Could not create group' }, { status: 502 });
  revalidatePath('/groups');
  return NextResponse.json(await res.json(), { status: 201 });
}
