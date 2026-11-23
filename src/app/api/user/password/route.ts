// src/app/api/user/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/db/auth-utils';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
    // Optional only for accounts that have no password yet (Google sign-up).
    currentPassword: z.string().optional(),
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
        // Accounts created with Google have no password: let them set one
        // (they're already signed in). Everyone else must confirm the old one.
        const isFirstPassword = !userRecord.passwordHash;
        if (!isFirstPassword) {
            if (!validated.currentPassword)
                return NextResponse.json({ error: 'Enter your current password' }, { status: 400 });
            const isValid = await verifyPassword(validated.currentPassword, userRecord.passwordHash!);
            if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        const hashed = await hashPassword(validated.newPassword);
        await db.update(users).set({ passwordHash: hashed, updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));

        await createAuditLog({ userId: user.id, action: 'PASSWORD_CHANGED', entityType: 'user', entityId: user.id, newData: { firstPassword: isFirstPassword } });

        return NextResponse.json({ success: true, firstPassword: isFirstPassword });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'Password must be 8+ chars with uppercase, lowercase, number, and special character' }, { status: 400 });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}