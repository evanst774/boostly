// src/app/api/auth/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { roles } from '@/lib/db/schema/rbac';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No token', authenticated: false },
        { status: 401 },
      );
    }

    const session = await db
      .select({
        session: sessions,
        user: users,
        role: roles.name,
      })
      .from(sessions)
      .where(eq(sessions.token, token))
      .innerJoin(users, eq(sessions.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .limit(1);

    if (!session[0] || new Date(session[0].session.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Invalid session', authenticated: false },
        { status: 401 },
      );
    }

    const role = session[0].role;
    const isAdmin = role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', authenticated: false, role },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,
      role,
      user: {
        id: session[0].user.id,
        email: session[0].user.email,
        name: session[0].user.name,
        role: role,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 },
    );
  }
}
