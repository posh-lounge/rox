import { NextResponse } from 'next/server';

export async function GET() {
  //console.log("[GET] Route hit");

  return NextResponse.json(
    { success: null, message: 'Forbidden. You do not have permission to access this resource.' },
    { status: 403 }
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
 
    const firstname   = formData.get('firstname') as string;
    const lastname    = formData.get('lastname')  as string;
    const email       = formData.get('email')     as string;
    const phonenumber = formData.get('phonenumber') as string | null;
    const password    = formData.get('password')  as string;
    const position    = formData.get('position')  as string | null;
    const department  = formData.get('department') as string | null;
    const base_currency = (formData.get('base_currency') as string | null) || 'RWF';
    const token       = formData.get('token')     as string | null;
    const avatarBlob  = formData.get('avatar')    as Blob | null;
 
    if (!firstname || !lastname || !email || !password) {
      return NextResponse.json({ success: false, message: 'Required fields missing' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }
 
    // Build FormData for the PHP backend
    const backendFd = new FormData();
    backendFd.append('firstname',     firstname);
    backendFd.append('lastname',      lastname);
    backendFd.append('email',         email);
    backendFd.append('phonenumber',   phonenumber || '');
    backendFd.append('passwords',     password);
    backendFd.append('status',        'active');
    backendFd.append('access_id',     '3');
    backendFd.append('base_currency', base_currency);
    if (position)    backendFd.append('position',    position);
    if (department)  backendFd.append('department',  department);
    if (token)       backendFd.append('token',       token);
    if (avatarBlob)  backendFd.append('avatar',      avatarBlob, 'avatar.webp');
 
    const API_URL = process.env.API_URL;
    const API_KEY = process.env.API_KEY;
    const origin  = process.env.URL_INFO ?? '';
 
    const response = await fetch(`${API_URL}/create-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'X-Origin-Check': origin,
      },
      body: backendFd,
    });
 
    const responseText = await response.text();
    let data: any;
    try { data = JSON.parse(responseText); } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON from server' }, { status: 500 });
    }
 
    if (!response.ok || data.success === false) {
      return NextResponse.json(
        { success: false, message: data.message || 'Registration failed' },
        { status: response.status }
      );
    }
 
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: { email, firstname, lastname },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Unknown error' }, { status: 500 });
  }
}