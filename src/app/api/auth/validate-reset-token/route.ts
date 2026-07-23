// src/app/api/auth/validate-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { otpVerifications } from '@/lib/db/schema/auth';
import { eq, and, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { message: 'Token is required' },
                { status: 400 }
            );
        }

        // 1. Check if token exists and is not expired in users table
        const userWithToken = await db
            .select({
                userId: users.id,
                email: users.email,
                passwordResetToken: users.passwordResetToken,
                passwordResetExpires: users.passwordResetExpires,
            })
            .from(users)
            .where(
                and(
                    eq(users.passwordResetToken, token),
                    gt(users.passwordResetExpires, new Date().toISOString())
                )
            )
            .limit(1);

        if (!userWithToken[0]) {
            return NextResponse.json(
                { message: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        // 2. Check if OTP exists, is not used, and not expired
        const otpRecord = await db
            .select()
            .from(otpVerifications)
            .where(
                and(
                    eq(otpVerifications.userId, userWithToken[0].userId),
                    eq(otpVerifications.code, token),
                    eq(otpVerifications.type, 'PASSWORD_RESET'),
                    eq(otpVerifications.used, false),
                    gt(otpVerifications.expiresAt, new Date().toISOString())
                )
            )
            .limit(1);

        if (!otpRecord[0]) {
            return NextResponse.json(
                { message: 'Token has already been used or expired' },
                { status: 400 }
            );
        }

        // Token is valid
        return NextResponse.json({
            valid: true,
            message: 'Token is valid'
        });
    } catch (error) {
        console.error('Token validation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}