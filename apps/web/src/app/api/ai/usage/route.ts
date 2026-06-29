import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const AI_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:4000';

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${AI_URL}/ai/usage`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ doc: { used: 0, limit: 3 }, chat: { used: 0, limit: 3 } });
  return NextResponse.json(await res.json());
}
