// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT, JWT_COOKIE_NAME, type JWTPayload } from '@/lib/jwt';

// ============================================
// ROUTE TABLES
// ============================================

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/2fa',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/verify-email',
];

const BOUNCE_IF_AUTHENTICATED_ROUTES = ['/login'];

const PUBLIC_ROUTES = [
  '/',
  '/forbidden',
  '/unauthorized',
  '/account-locked',
  '/about',
  '/blog',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/resources',
  '/resources/documentation',
  '/resources/guides',
  '/resources/faq',
  '/resources/api',
  '/resources/changelog',
  '/help',
  '/support',
  '/trial',
  '/splash',
  '/onboarding',
  '/ref',
  '/auth/oauth',
];

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/validate-reset-token',
  '/api/auth/verify',
  '/api/auth/2fa',
  '/api/auth/resend-2fa',
  '/api/auth/notify-locked',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/oauth/google',
  '/api/auth/oauth/google/callback',
  '/api/auth/oauth/facebook',
  '/api/auth/oauth/facebook/callback',
  '/api/health',
  '/api/public',
  '/api/public/withdrawals/latest',
  '/api/public/withdrawals/recent',
  '/api/public/withdrawals/leaderboard',
  '/api/settings/currency',
];

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

// ============================================
// ROUTE MATCHERS
// ============================================

// ✅ FIXED: Strip query parameters and trailing slashes before matching
function matchesRoute(pathname: string, routes: string[]): boolean {
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '');
  return routes.some(
    (route) => cleanPath === route || cleanPath.startsWith(route + '/'),
  );
}

const isPublicApiRoute = (p: string) => matchesRoute(p, PUBLIC_API_ROUTES);
const isAuthRoute = (p: string) => matchesRoute(p, AUTH_ROUTES);
const shouldBounceIfAuthenticated = (p: string) =>
  matchesRoute(p, BOUNCE_IF_AUTHENTICATED_ROUTES);

const isAdminRoute = (p: string) => p === '/admin' || p.startsWith('/admin/');

function isPublicRoute(pathname: string): boolean {
  const cleanPath = pathname.split('?')[0];
  if (cleanPath === '/') return true;
  if (matchesRoute(cleanPath, PUBLIC_ROUTES)) return true;
  if (cleanPath.startsWith('/_next')) return true;
  if (cleanPath.startsWith('/img')) return true;
  if (cleanPath.startsWith('/icons')) return true;
  if (cleanPath.startsWith('/fonts')) return true;
  if (cleanPath.startsWith('/favicon')) return true;
  if (cleanPath.startsWith('/manifest')) return true;
  if (cleanPath.startsWith('/robots')) return true;
  if (cleanPath.startsWith('/sitemap')) return true;
  if (cleanPath.includes('#')) return true;
  return false;
}

// ============================================
// HELPERS
// ============================================

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(JWT_COOKIE_NAME);
  return response;
}

function withAuthHeaders(request: NextRequest, payload: JWTPayload) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set(
    'x-user-roles',
    JSON.stringify(payload.roles || [payload.role]),
  );
  return NextResponse.next({ request: { headers: requestHeaders } });
}

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cleanPath = pathname.split('?')[0];

  if (process.env.NODE_ENV === 'development') {
    console.log(`[MIDDLEWARE] ${pathname} (clean: ${cleanPath})`);
  }

  // 1. Public API routes
  if (isPublicApiRoute(cleanPath)) {
    return NextResponse.next();
  }

  // 2. Public frontend routes
  if (isPublicRoute(cleanPath)) {
    return NextResponse.next();
  }

  // 3. JWT check only — no DB access here
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  let payload: JWTPayload | null = null;

  if (token) {
    try {
      payload = await verifyJWT(token);
    } catch (error) {
      console.error('[MIDDLEWARE] Token verification error:', error);
      return redirectToLogin(request, cleanPath);
    }
  }

  const role = payload?.role || 'USER';
  const isAdminUser = ADMIN_ROLES.has(role);

  // 4. Auth pages — only /login bounces authenticated users
  if (isAuthRoute(cleanPath)) {
    if (payload && shouldBounceIfAuthenticated(cleanPath)) {
      const destination = isAdminUser ? '/admin/dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  // 5. Admin routes — require auth + admin role
  if (isAdminRoute(cleanPath)) {
    if (!payload) return redirectToLogin(request, cleanPath);
    if (!isAdminUser) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return withAuthHeaders(request, payload);
  }

  // 6. Everything else is protected by default
  if (!payload) {
    if (cleanPath.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return redirectToLogin(request, cleanPath);
  }

  // Admin redirect to admin dashboard
  if (
    isAdminUser &&
    !cleanPath.startsWith('/api/') &&
    !cleanPath.startsWith('/admin')
  ) {
    // Skip redirect for auth pages
    if (!isAuthRoute(cleanPath) && !isPublicRoute(cleanPath)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  if (cleanPath.startsWith('/api/')) {
    return NextResponse.next();
  }

  return withAuthHeaders(request, payload);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|img/|fonts/|assets/).*)',
  ],
};
