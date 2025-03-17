///scr/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Add CORS headers for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Max-Age', '3600');
    return res;
  }

  // Check for session cookie
  const sessionCookie = req.cookies.get('session');
  let sessionData = null;
  
  try {
    if (sessionCookie) {
      sessionData = JSON.parse(sessionCookie.value);
    }
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
  }
  
  // Protected routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!sessionData) {
      // No session cookie, redirect to login
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Check if user has admin role
    if (sessionData.role !== 'admin' && sessionData.role !== 'creator') {
      // User doesn't have admin role, redirect to home
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  // Auth routes
  if (req.nextUrl.pathname === '/login' && sessionData) {
    // Already logged in, redirect to appropriate page
    if (sessionData.role === 'admin' || sessionData.role === 'creator') {
      return NextResponse.redirect(new URL('/admin', req.url));
    } else {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Include API routes in the matcher
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};