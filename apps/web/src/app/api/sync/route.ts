import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.SYNC_SERVICE_URL}/sync/flush`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
    },
    body: req.body,
    // @ts-ignore — Node fetch supports duplex
    duplex: 'half',
  });

  return new NextResponse(res.body, {
    status:  res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
