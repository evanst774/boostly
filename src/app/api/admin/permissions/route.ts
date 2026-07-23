// src/app/api/admin/permissions/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { permissions } from '@/lib/db/schema/rbac';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await requirePermission(PermissionKeys.ROLES_MANAGE);

        const allPerms = await db
            .select({ id: permissions.id, key: permissions.key, module: permissions.module, description: permissions.description })
            .from(permissions).orderBy(asc(permissions.module), asc(permissions.key));

        return NextResponse.json({ permissions: allPerms });
    } catch (error) {
        console.error('Permissions list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}