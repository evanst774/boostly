// src/app/api/admin/roles/[id]/toggle-permission/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { roles, permissions, rolePermissions } from '@/lib/db/schema/rbac';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await requirePermission(PermissionKeys.ROLES_MANAGE);

        const roleId = params.id;
        const { permissionKey } = await request.json();

        if (!permissionKey) {
            return NextResponse.json({ error: 'Permission key is required' }, { status: 400 });
        }

        // Verify role exists — ALL roles can be modified (system + custom)
        const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, roleId)).limit(1);
        if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

        // Get permission ID
        const [perm] = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.key, permissionKey)).limit(1);
        if (!perm) return NextResponse.json({ error: 'Permission not found' }, { status: 404 });

        // Check if already assigned
        const [existing] = await db
            .select({ id: rolePermissions.id })
            .from(rolePermissions)
            .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, perm.id)))
            .limit(1);

        if (existing) {
            await db.delete(rolePermissions).where(eq(rolePermissions.id, existing.id));
        } else {
            await db.insert(rolePermissions).values({ roleId, permissionId: perm.id });
        }

        // Return updated permissions list
        const updatedPerms = await db
            .select({ key: permissions.key })
            .from(permissions)
            .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
            .where(eq(rolePermissions.roleId, roleId));

        return NextResponse.json({ permissions: updatedPerms.map(p => p.key) });
    } catch (error) {
        console.error('Toggle permission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}