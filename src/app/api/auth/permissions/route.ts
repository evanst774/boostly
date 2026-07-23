// src/app/api/auth/permissions/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { getUserPermissions } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const permissions = await getUserPermissions(user.id);
        
        return NextResponse.json({ permissions });
    } catch (error) {
        console.error('Permissions API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}