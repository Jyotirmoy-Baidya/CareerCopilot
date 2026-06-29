import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const AI_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:4005';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${AI_URL}/ai/document`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
