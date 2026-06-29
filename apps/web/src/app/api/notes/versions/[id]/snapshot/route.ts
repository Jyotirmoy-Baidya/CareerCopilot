import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const SYNC_URL = process.env.SYNC_SERVICE_URL ?? 'http://localhost:4003';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${SYNC_URL}/sync/versions/${params.id}/snapshot`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'Snapshot not found' }, { status: 502 });
  return NextResponse.json(await res.json());
}
