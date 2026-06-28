// lib/api/phpProxy.ts
// Generic proxy helper — wraps all backend PHP calls with session auth
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function phpProxy(phpEndpoint: string, request: Request, extraBody: Record<string, unknown> = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const payload = { userId: session.user.id, ...body, ...extraBody };
    const res = await fetch(`${process.env.API_URL}/v1/${phpEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.API_KEY}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
