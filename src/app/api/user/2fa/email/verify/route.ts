// src/app/api/user/2fa/email/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users, otpVerifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type TwoFAMethod = 'EMAIL' | 'TOTP';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { code } = await request.json();

        // Verify OTP
        const otpRecord = await db.query.otpVerifications.findFirst({
            where: and(
                eq(otpVerifications.userId, user.id),
                eq(otpVerifications.code, code),
                eq(otpVerifications.type, '2FA_SETUP'),
                eq(otpVerifications.used, false),
            ),
        });

        if (!otpRecord || new Date(otpRecord.expiresAt) < new Date()) {
            return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
        }

        // Mark OTP as used
        await db
            .update(otpVerifications)
            .set({ used: true, updatedAt: new Date().toISOString() })
            .where(eq(otpVerifications.id, otpRecord.id));

        // Get current enabled methods
        const record = await db
            .select({ twoFAEnabledMethods: users.twoFAEnabledMethods })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        let methods: TwoFAMethod[] = [];
        if (record[0]?.twoFAEnabledMethods && Array.isArray(record[0].twoFAEnabledMethods)) {
            methods = record[0].twoFAEnabledMethods.filter(
                (m): m is TwoFAMethod => m === 'EMAIL' || m === 'TOTP'
            );
        }

        // Add EMAIL if not present
        if (!methods.includes('EMAIL')) {
            methods.push('EMAIL');
        }

        const defaultMethod: TwoFAMethod = methods[0];

        await db
            .update(users)
            .set({
                twoFAEnabledMethods: methods,
                twoFADefaultMethod: defaultMethod,
                is2FAEnabled: true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error verifying email 2FA:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}