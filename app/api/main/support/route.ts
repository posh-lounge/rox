import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export async function GET() {
    return NextResponse.json({ success: null, message: 'Forbidden. You do not have permission to access this resource.' }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const API_URL = process.env.API_URL; // Ensure the API URL is securely stored
    const API_KEY = process.env.API_KEY; // Ensure the API Key is securely stored
    // Parse incoming request body
    const session = await getServerSession({ Request, ...authOptions });

    if (!session || !session.user) {
        return NextResponse.json({ success: null, message: "No session detected. Unauthorized access." }, { status: 401 });
    }

    const userId = session.user.id;


    // Extract origin from headers
    const origin = request.headers.get('origin') || 'https://default-origin.com'; // Default fallback if origin is not provided


    const response =  await fetch(`${API_URL}/support/session_check`, {
      method: 'POST',
      credentials: 'include', // If needed for cookies or sessions
      headers: {
        'Content-Type': 'application/json',
         Authorization: `Bearer ${API_KEY}`, // Securely passed API Key
        'X-Origin-Check': origin, // Pass the origin from the frontend
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ success: null, message: 'Unauthorized access.' }, { status: 401 });
      } else if(response.status === 403){
        return NextResponse.json({ success: null, message: 'Forbidden. You do not have permission to access this resource.' }, { status: 403 });
      }else if (response.status === 301) {
        return NextResponse.json({ success: null, message: data.message }, { status: 301 });
      } else if (response.status === 400) {
        return NextResponse.json({ success: null, message: `${data.message} - ${userId}`}, { status:400 });
      } else if (response.status === 404) {
        return NextResponse.json({ success: null, message: 'Account not found. Check the URL or server configuration.' }, { status: 404 });
      } else {
        return NextResponse.json({ success: null, message: `Failed to fetch Account: ${response.status}` }, { status: 500 });
      }
    }
   

    return NextResponse.json({ success: true, message: data.message , sessiondata: data.sessiondata }, { status: 200 });

  } catch (error: any) {
    console.error('Error while fetching Account:', error);
    return NextResponse.json({ success: null, message: error instanceof Error ? error.message : 'Unknown error occurred' }, { status: 500 });
  }
}
