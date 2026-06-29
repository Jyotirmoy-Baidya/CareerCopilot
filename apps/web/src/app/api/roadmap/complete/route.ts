import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { mintServiceToken } from '@/lib/service-token';

const RECOMMEND = process.env.RECOMMENDATION_SERVICE_URL ?? 'http://localhost:4002';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { nodeId, roadmapId } = await req.json();
  if (!nodeId || !roadmapId) {
    return NextResponse.json({ error: 'nodeId and roadmapId are required' }, { status: 400 });
  }

  const token = mintServiceToken({ ...session.user, id: session.user.id ?? '', role: (session.user as any).role });

  const res = await fetch(`${RECOMMEND}/recommendation/complete-skill`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ nodeId, roadmapId }),
  }).catch(() => null);

  if (!res?.ok) {
    const data = await res?.json().catch(() => ({}));
    return NextResponse.json({ error: data?.error ?? 'Failed to mark skill complete' }, { status: res?.status ?? 502 });
  }

  revalidatePath('/roadmap');
  return NextResponse.json(await res.json());
}
