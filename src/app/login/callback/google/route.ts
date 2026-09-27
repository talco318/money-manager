// Redirect callback from /login/callback/google to /api/auth/callback/google
// This handles the case where NextAuth sends the callback to this path

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const newUrl = new URL('/api/auth/callback/google', url.origin);
  
  // Copy all search params (state, code, etc.)
  url.searchParams.forEach((value, key) => {
    newUrl.searchParams.set(key, value);
  });
  
  return NextResponse.redirect(newUrl);
}
