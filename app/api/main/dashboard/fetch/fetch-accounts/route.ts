import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const res  = await fetch(`${process.env.API_URL}/api/v1/fetch/fetch-accounts.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
