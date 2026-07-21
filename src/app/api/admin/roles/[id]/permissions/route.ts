// src/app/api/admin/roles/[id]/permissions/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { permissions, rolePermissions } from '@/lib/db/schema/rbac';
import { eq } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await requirePermission(PermissionKeys.ROLES_MANAGE);

        const perms = await db
            .select({ key: permissions.key, module: permissions.module, description: permissions.description, id: permissions.id })
            .from(permissions)
            .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
            .where(eq(rolePermissions.roleId, params.id));

        return NextResponse.json({
            permissions: perms.map(p => ({ ...p, description: p.description || p.key })),
        });
    } catch (error) {
        console.error('Role permissions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}