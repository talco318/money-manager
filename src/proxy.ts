import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Static file extensions to allow
const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.css', '.js', '.woff', '.woff2'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Allow static file extensions
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Allow ALL auth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow login page (public)
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return NextResponse.next();
  }

  // Check for NextAuth session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For pages, redirect to our custom login page
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
