import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const SYNC_URL = process.env.SYNC_SERVICE_URL ?? 'http://localhost:4003';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const noteId = req.nextUrl.searchParams.get('noteId');
  if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 });

  const res = await fetch(`${SYNC_URL}/sync/versions?noteId=${noteId}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ versions: [] });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${SYNC_URL}/sync/versions`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'Could not save version' }, { status: 502 });
  return NextResponse.json(await res.json(), { status: 201 });
}
