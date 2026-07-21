// src/lib/auth/session.server.ts
import { cookies } from 'next/headers';
import { verifyJWT, JWT_COOKIE_NAME } from '@/lib/jwt';
import {
  getCurrentSession,
  getUserWithRoles,
  getSessionByToken,
} from '@/lib/db/auth-utils';
import { SystemRoles } from '@/modules/rbac/roles';

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
}

// ============================================
// FIX: previously re-implemented the JWT → user →
// roles → session-liveness chain independently of
// auth-utils.ts, including its own hardcoded
// 'SALES_PERSON' default role that could drift from
// SystemRoles.USER. Now delegates entirely to
// getCurrentSession(), the one canonical DB-checked
// session resolver everything else should also use.
// ============================================
export async function getSession(): Promise<SessionUser | null> {
  try {
    // getCurrentSession() reads the cookie internally via
    // next/headers, verifies the JWT, and checks the sessions
    // table for liveness — no need to duplicate any of that here.
    const current = await getCurrentSession();
    if (!current) return null;

    const { user } = current;
    const primaryRole = user.roles[0] || SystemRoles.USER;

    return {
      userId: user.id,
      email: user.email,
      name: user.name || '',
      role: primaryRole,
      roles: user.roles,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Server-only function
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return getUserWithRoles(session.userId);
}

// ============================================
// Server-only function for API routes / handlers that
// receive a raw Request instead of using next/headers'
// cookies() directly.
//
// FIX (the actual bug you flagged): this previously
// verified the JWT and fetched the user + roles, but
// NEVER queried the `sessions` table at all — so a
// revoked or expired DB session with a still-valid JWT
// was silently accepted. Unlike middleware.ts (which
// skips the DB check intentionally, because the edge
// runtime's libsql client can't open `file:` URLs),
// this function runs in the Node runtime and has full
// DB access — there was no reason for it to skip the
// check. Any API route/webhook using this was exposed.
// Now performs the same liveness check as getSession().
// ============================================
export async function getSessionFromRequest(
  request: Request,
): Promise<SessionUser | null> {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookieMap = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) acc[key] = decodeURIComponent(value);
        return acc;
      },
      {} as Record<string, string>,
    );

    const token = cookieMap[JWT_COOKIE_NAME];
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || !payload.sub) return null;

    // DB liveness check — this was the missing piece.
    const dbSession = await getSessionByToken(token);
    if (!dbSession || new Date(dbSession.expiresAt) < new Date()) {
      return null;
    }

    const user = await getUserWithRoles(payload.sub);
    if (!user || !user.isActive) return null;

    const primaryRole = user.roles[0] || SystemRoles.USER;

    return {
      userId: user.id,
      email: user.email,
      name: user.name || '',
      role: primaryRole,
      roles: user.roles,
    };
  } catch (error) {
    console.error('Error getting session from request:', error);
    return null;
  }
}

// Re-exported for convenience in callers that only have `cookies()`
// available (Server Components / Route Handlers) and don't want to
// import from next/headers directly.
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(JWT_COOKIE_NAME)?.value ?? null;
}
