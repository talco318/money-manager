import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const publicRoutes = ['/login'];

// API routes that are part of NextAuth (must be accessible for auth flow)
const authApiRoutes = ['/api/auth'];

// Static file extensions to allow
const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.css', '.js', '.woff', '.woff2'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth API routes (required for login/logout flow)
  if (authApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public routes (login page)
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Allow Next.js internals
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Allow only specific static file extensions (not all files with dots)
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Check for NextAuth session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    // Save the original URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Additional security: verify token has required fields
  if (!token.email) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid session', message: 'Session is missing required data' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
