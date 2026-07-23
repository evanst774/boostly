// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { sessions } from '@/lib/db/schema/auth';
import { userRoles, roles } from '@/lib/db/schema/rbac';
import { eq } from 'drizzle-orm';
import { verifyJWT, JWT_COOKIE_NAME } from '@/lib/jwt';
import { SystemRoles } from '@/modules/rbac/roles';

export const dynamic = 'force-dynamic';

// ============================================
// FIX: the only functional bug here was the
// 'SALES_PERSON' hardcoded fallback role, which
// doesn't match SystemRoles.USER used everywhere
// else (auth-utils.ts, AuthContext.tsx, jwt.ts).
// A user with no assigned roles would get a
// different default identity depending on which
// code path resolved their session. Everything
// else in this route (the DB session-liveness
// check) was already correct — this is the
// reference implementation the other files were
// missing pieces of.
// ============================================
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // Verify JWT
    const payload = await verifyJWT(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // DB session liveness check — do not remove. This is what
    // catches revoked/force-logged-out sessions whose JWT hasn't
    // expired yet. Middleware intentionally cannot do this check
    // (edge runtime can't reach the DB), so this route is one of
    // the places that must.
    const dbSession = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }

    if (new Date(dbSession.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get user with ALL fields
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 },
      );
    }

    // Get user's roles from RBAC (or use JWT roles)
    let rolesList: string[] = [];

    // Try to get roles from JWT first (faster)
    if (
      payload.roles &&
      Array.isArray(payload.roles) &&
      payload.roles.length > 0
    ) {
      rolesList = payload.roles;
    } else {
      // Fallback to database query
      const userRolesList = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, user.id));
      rolesList = userRolesList.map((ur) => ur.roleName);
    }

    // FIX: was the string literal 'SALES_PERSON'. Now uses the
    // same SystemRoles.USER constant every other auth path falls
    // back to (auth-utils.ts createAuthToken(), session.server.ts
    // getSession()/getSessionFromRequest()).
    const primaryRole = payload.role || rolesList[0] || SystemRoles.USER;

    // Return FULL user object with all fields
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: primaryRole,
        roles: rolesList,
        emailVerified: !!user.emailVerifiedAt,
        isActive: user.isActive,
        avatar: user.avatar,
        avatarKey: user.avatarKey,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
