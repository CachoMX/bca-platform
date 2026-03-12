import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const publicRoutes = ['/login', '/api/auth', '/api/sms/webhook'];

// API routes that require admin role
const adminApiRoutes = ['/api/users', '/api/import', '/api/settings'];
// API routes that require admin or manager role
const managerApiRoutes = ['/api/admin/time', '/api/reports'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login (pages) or 401 (API)
  if (!req.auth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth.user?.role as number | undefined;

  // Admin-only page routes
  const adminRoutes = ['/admin/users', '/admin/quotes', '/admin/rebuttals', '/admin/import'];
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 1) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Admin + Manager page routes
  const managerRoutes = ['/admin/time', '/reports'];
  if (managerRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 1 && role !== 2) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Admin-only API routes
  if (adminApiRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Admin + Manager API routes
  if (managerApiRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
