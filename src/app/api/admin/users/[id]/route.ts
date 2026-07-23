// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import {
  userRoles,
  roles,
  permissions,
  rolePermissions,
} from '@/lib/db/schema/rbac';
import { eq, inArray } from 'drizzle-orm';
import { hashPassword } from '@/lib/db/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.USERS_MANAGE);

    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user roles
    const userRoleList = await db
      .select({ roleName: roles.name, roleId: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, params.id));

    const roleName = userRoleList[0]?.roleName || null;
    const roleId = userRoleList[0]?.roleId || null;

    // Get permissions
    let userPerms: { key: string; module: string; description: string }[] = [];
    if (userRoleList.length > 0) {
      const roleIds = userRoleList.map((r) => r.roleId);
      const rawPerms = await db
        .select({
          key: permissions.key,
          module: permissions.module,
          description: permissions.description,
        })
        .from(permissions)
        .innerJoin(
          rolePermissions,
          eq(permissions.id, rolePermissions.permissionId),
        )
        .where(inArray(rolePermissions.roleId, roleIds))
        .limit(20);

      userPerms = rawPerms.map((p) => ({
        key: p.key,
        module: p.module,
        description: p.description || p.key,
      }));
    }

    return NextResponse.json({
      user: {
        ...user,
        roleName,
        roleId,
        permissions: userPerms,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
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
    const { name, email, phone, roleId, isActive, password } = body;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check email uniqueness
    if (email && email !== existingUser.email) {
      const duplicate = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 },
        );
      }
    }

    // Update user
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    await db.update(users).set(updateData).where(eq(users.id, params.id));

    // Update role through junction table if changed
    if (roleId !== undefined) {
      // Remove existing roles
      await db.delete(userRoles).where(eq(userRoles.userId, params.id));

      // Assign new role if provided
      if (roleId) {
        await db.insert(userRoles).values({
          userId: params.id,
          roleId: roleId,
          assignedBy: currentUser.id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.USERS_MANAGE);

    // Prevent deleting yourself
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 },
      );
    }

    await db.delete(users).where(eq(users.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
