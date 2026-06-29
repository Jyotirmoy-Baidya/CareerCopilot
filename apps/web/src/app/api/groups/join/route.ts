import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });

  const res = await fetch(`${COLLAB_URL}/groups/join`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ inviteCode, userId: session.user.id }),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'Invalid invite code' }, { status: res?.status ?? 502 });
  const data = await res.json();
  revalidatePath('/groups');
  return NextResponse.json(data, { status: res.status });
}
