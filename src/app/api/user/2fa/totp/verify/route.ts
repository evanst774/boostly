// src/app/api/user/2fa/totp/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { verifyTOTPCode } from '@/lib/totp';

export const dynamic = 'force-dynamic';

type TwoFAMethod = 'EMAIL' | 'TOTP';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { code } = await request.json();

        // Get user's TOTP secret and current methods
        const record = await db
            .select({
                totpSecret: users.totpSecret,
                twoFAEnabledMethods: users.twoFAEnabledMethods,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!record[0]?.totpSecret) {
            return NextResponse.json({ error: 'TOTP not set up. Please setup first.' }, { status: 400 });
        }

        // Verify TOTP code
        const isValid = await verifyTOTPCode(record[0].totpSecret, code, user.email);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // Parse existing methods
        let methods: TwoFAMethod[] = [];
        if (record[0]?.twoFAEnabledMethods && Array.isArray(record[0].twoFAEnabledMethods)) {
            methods = record[0].twoFAEnabledMethods.filter(
                (m): m is TwoFAMethod => m === 'EMAIL' || m === 'TOTP'
            );
        }

        // Add TOTP if not present
        if (!methods.includes('TOTP')) {
            methods.push('TOTP');
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
        console.error('Error verifying TOTP:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}