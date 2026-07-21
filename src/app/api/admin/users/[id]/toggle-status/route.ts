// src/app/api/admin/users/[id]/toggle-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.USERS_MANAGE);

    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 },
      );
    }

    await db
      .update(users)
      .set({
        isActive: active,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, params.id));

    return NextResponse.json({
      success: true,
      isActive: active,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
