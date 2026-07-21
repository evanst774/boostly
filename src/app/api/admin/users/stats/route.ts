// src/app/api/admin/users/stats/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { roles, userRoles } from '@/lib/db/schema/rbac';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission(PermissionKeys.USERS_MANAGE);

    // Get counts for Boostly users
    const [
      totalResult,
      activeResult,
      inactiveResult,
      adminResult,
      superAdminResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, false)),
      // Count admins from userRoles junction table
      db
        .select({ count: sql<number>`count(DISTINCT ${userRoles.userId})` })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.name, 'ADMIN')),
      // Count super admins
      db
        .select({ count: sql<number>`count(DISTINCT ${userRoles.userId})` })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.name, 'SUPER_ADMIN')),
    ]);

    return NextResponse.json({
      total: Number(totalResult[0]?.count ?? 0),
      active: Number(activeResult[0]?.count ?? 0),
      inactive: Number(inactiveResult[0]?.count ?? 0),
      admins: Number(adminResult[0]?.count ?? 0),
      superAdmins: Number(superAdminResult[0]?.count ?? 0),
    });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json(
      {
        total: 0,
        active: 0,
        inactive: 0,
        admins: 0,
        superAdmins: 0,
      },
      { status: 500 },
    );
  }
}
