import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mintServiceToken } from '@/lib/service-token';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body  = await req.json();
  const token = mintServiceToken({ ...session.user, id: session.user.id ?? '', role: (session.user as any).role });

  const res = await fetch(`${process.env.AUTH_SERVICE_URL}/auth/onboard`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
