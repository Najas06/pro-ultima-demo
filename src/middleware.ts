import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth user from cookie or header
  const authUser = request.cookies.get('auth_user')?.value;

  let user = null;
  if (authUser) {
    try {
      user = JSON.parse(authUser);
    } catch {
      user = null;
    }
  }

  // Public routes
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If accessing login page and already authenticated, redirect to appropriate dashboard
  if (pathname.startsWith('/login') && user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard';
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // If accessing protected route without authentication, redirect to login
  if (!isPublicRoute && !user && (pathname.startsWith('/admin') || pathname.startsWith('/staff'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  if (user) {
    // Admin trying to access staff routes
    if (user.role === 'admin' && pathname.startsWith('/staff')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Staff trying to access admin routes
    if (user.role === 'staff' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    }
  }

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

