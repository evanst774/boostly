// src/app/api/user/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/db/auth-utils';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
});

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validated = changePasswordSchema.parse(body);

        const userRecord = await db.query.users.findFirst({ where: eq(users.id, user.id) });
        if (!userRecord) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (!userRecord.passwordHash)
            return NextResponse.json({ error: 'This account has no password set (OAuth-only)' }, { status: 400 });

        const isValid = await verifyPassword(validated.currentPassword, userRecord.passwordHash);
        if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

        const hashed = await hashPassword(validated.newPassword);
        await db.update(users).set({ passwordHash: hashed, updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));

        await createAuditLog({ userId: user.id, action: 'PASSWORD_CHANGED', entityType: 'user', entityId: user.id });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'Password must be 8+ chars with uppercase, lowercase, number, and special character' }, { status: 400 });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}