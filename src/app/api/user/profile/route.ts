// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2).max(100),
    phone: z.string().optional(),
});

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validated = updateProfileSchema.parse(body);

        await db.update(users)
            .set({ name: validated.name, phone: validated.phone || null, updatedAt: new Date().toISOString() })
            .where(eq(users.id, user.id));

        await createAuditLog({
            userId: user.id,
            action: 'PROFILE_UPDATED',
            entityType: 'user',
            entityId: user.id,
            newData: { name: validated.name, phone: validated.phone },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}