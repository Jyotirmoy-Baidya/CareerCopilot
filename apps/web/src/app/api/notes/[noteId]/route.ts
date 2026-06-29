import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const COLLAB_URL = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

export async function GET(_req: NextRequest, { params }: { params: { noteId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${COLLAB_URL}/notes/${params.noteId}`).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  return NextResponse.json(await res.json());
}

export async function PATCH(req: NextRequest, { params }: { params: { noteId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const res = await fetch(`${COLLAB_URL}/notes/${params.noteId}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ title, userId: session.user.id }),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'Could not rename note' }, { status: 502 });
  return NextResponse.json(await res.json());
}
