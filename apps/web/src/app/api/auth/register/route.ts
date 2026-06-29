import { NextRequest, NextResponse } from 'next/server';

// Proxy registration to the auth service — the web app never touches the database directly
export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${process.env.AUTH_SERVICE_URL}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
