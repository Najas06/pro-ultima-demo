import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple logic: Let client-side handle all authentication
  // This prevents any middleware interference with navigation
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest|sw.js).*)',
  ],
};

