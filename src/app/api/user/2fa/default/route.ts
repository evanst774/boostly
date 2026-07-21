// src/app/api/user/2fa/default/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

type TwoFAMethod = 'EMAIL' | 'TOTP';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { method } = await request.json();

        if (!method || !['EMAIL', 'TOTP'].includes(method)) {
            return NextResponse.json({ error: 'Invalid method. Must be EMAIL or TOTP' }, { status: 400 });
        }

        const newDefault: TwoFAMethod = method as TwoFAMethod;

        // Verify the method is actually enabled
        const record = await db
            .select({ twoFAEnabledMethods: users.twoFAEnabledMethods })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        let enabledMethods: TwoFAMethod[] = [];
        if (record[0]?.twoFAEnabledMethods && Array.isArray(record[0].twoFAEnabledMethods)) {
            enabledMethods = record[0].twoFAEnabledMethods.filter(
                (m): m is TwoFAMethod => m === 'EMAIL' || m === 'TOTP'
            );
        }

        if (!enabledMethods.includes(newDefault)) {
            return NextResponse.json(
                { error: `Cannot set ${method} as default. It is not enabled.` },
                { status: 400 }
            );
        }

        await db
            .update(users)
            .set({
                twoFADefaultMethod: newDefault,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error setting default 2FA:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}