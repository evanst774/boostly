// src/app/api/auth/sudo/disable/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { sudoSettings, sudoSessions } from '@/lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const permissions = await getUserPermissions(user.id);
    const canManageSudo =
      permissions.includes('*') ||
      permissions.includes(PermissionKeys.SYSTEM_CONFIG) ||
      permissions.includes(PermissionKeys.SUDO_MANAGE);

    if (!canManageSudo) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete sudo settings
    await db.delete(sudoSettings).where(eq(sudoSettings.userId, user.id));

    // Delete any active sudo sessions
    await db
      .delete(sudoSessions)
      .where(
        and(
          eq(sudoSessions.userId, user.id),
          eq(sudoSessions.isVerified, true),
        ),
      );

    return NextResponse.json({
      success: true,
      message: 'Sudo mode disabled successfully',
    });
  } catch (error) {
    console.error('Sudo disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
