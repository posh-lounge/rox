import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const currentPath = req.nextUrl.pathname;

  // Handle root path `/`
  if (currentPath === '/') {
    if (token && token.role === 'dashboard') {
      // Redirect to `/dashboard` if user is logged in and has the dashboard role
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }else if (token && token.role === 'manager') {
      // Redirect to `/dashboard` if user is logged in and has the dashboard role
      return NextResponse.redirect(new URL('/cowork', req.url));
    }else if (token && token.role === 'cowork') {
      // Redirect to `/dashboard` if user is logged in and has the dashboard role
      return NextResponse.redirect(new URL('/cowork', req.url));
    }else if (token && token.role === 'other') {
      // Redirect to `/dashboard` if user is logged in and has the dashboard role
      return NextResponse.redirect(new URL('/other', req.url));
    }
    // Allow unauthenticated users to remain on `/`
    return NextResponse.next();
  }

  // Handle protected `/dashboard` paths
  if (currentPath.startsWith('/dashboard')) {
    if (!token || token.role !== 'dashboard') {
      // Redirect to `/` if no valid token or wrong role
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

    // Handle protected `/dashboard` paths
    if (currentPath.startsWith('/cowork')) {
      if (!token || token.role !== 'cowork') {
        // Redirect to `/` if no valid token or wrong role
        return NextResponse.redirect(new URL('/', req.url));
      }
    }


    
    // Handle protected `/dashboard` paths
    if (currentPath.startsWith('/other')) {
      if (!token || token.role !== 'other') {
        // Redirect to `/` if no valid token or wrong role
        return NextResponse.redirect(new URL('/', req.url));
      }
    }




  // Allow all other requests to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*','/cowork/:path*'], // Apply middleware to `/` and `/dashboard` routes
};
