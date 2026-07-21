// src/app/api/admin/roles/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { roles, permissions, rolePermissions } from '@/lib/db/schema/rbac';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await requirePermission(PermissionKeys.ROLES_MANAGE);

        // Get all roles with their permissions
        const allRoles = await db
            .select({
                id: roles.id,
                name: roles.name,
                description: roles.description,
                isSystem: roles.isSystem,
            })
            .from(roles)
            .orderBy(asc(roles.isSystem), asc(roles.name));

        // Fetch permissions for each role
        const rolesWithPermissions = await Promise.all(
            allRoles.map(async (role) => {
                const perms = await db
                    .select({ key: permissions.key })
                    .from(permissions)
                    .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
                    .where(eq(rolePermissions.roleId, role.id));

                return {
                    ...role,
                    permissions: perms.map(p => p.key),
                };
            })
        );

        return NextResponse.json({ roles: rolesWithPermissions });
    } catch (error) {
        console.error('Roles list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}