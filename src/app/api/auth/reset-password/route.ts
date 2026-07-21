// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { otpVerifications } from '@/lib/db/schema/auth';
import { createAuditLog } from '@/lib/audit';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword } from '@/lib/db/auth-utils';

// ============================================
// Validation Schema
// ============================================
const resetPasswordSchema = z.object({
    token: z.string().min(32, "Invalid token format"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export async function POST(request: NextRequest) {
    try {
        // 1. Parse and validate input
        const body = await request.json();
        const validationResult = resetPasswordSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map(e => e.message);
            return NextResponse.json(
                { message: 'Validation failed', errors },
                { status: 400 }
            );
        }

        const { token, password } = validationResult.data;

        // 2. FIRST - Validate token exists and is not expired
        //    This should be the primary check before any password processing
        const tokenCheck = await db
            .select({
                userId: users.id,
                email: users.email,
                name: users.name,
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

        if (!tokenCheck[0]) {
            // Check if token exists but expired (for better error message)
            const expiredToken = await db
                .select()
                .from(users)
                .where(eq(users.passwordResetToken, token))
                .limit(1);

            const errorMessage = expiredToken[0]
                ? 'Password reset link has expired. Please request a new one.'
                : 'Invalid password reset link. Please request a new one.';

            await createAuditLog({
                userId: "system",
                action: "PASSWORD_RESET_FAILED",
                entityType: "user",
                newData: {
                    reason: expiredToken[0] ? 'Token expired' : 'Invalid token',
                    tokenPrefix: token.substring(0, 8)
                },
            });

            return NextResponse.json(
                { message: errorMessage },
                { status: 400 }
            );
        }

        const user = tokenCheck[0];

        // 3. Validate OTP record exists and is not used
        const otpCheck = await db
            .select()
            .from(otpVerifications)
            .where(
                and(
                    eq(otpVerifications.userId, user.userId),
                    eq(otpVerifications.code, token),
                    eq(otpVerifications.type, 'PASSWORD_RESET'),
                    eq(otpVerifications.used, false)
                )
            )
            .limit(1);

        if (!otpCheck[0]) {
            await createAuditLog({
                userId: user.userId,
                action: "PASSWORD_RESET_FAILED",
                entityType: "user",
                entityId: user.userId,
                newData: { reason: 'OTP already used or invalid' },
            });

            return NextResponse.json(
                { message: 'This password reset link has already been used. Please request a new one.' },
                { status: 400 }
            );
        }

        // 4. Check if OTP is expired (additional safety)
        if (new Date(otpCheck[0].expiresAt) < new Date()) {
            await createAuditLog({
                userId: user.userId,
                action: "PASSWORD_RESET_FAILED",
                entityType: "user",
                entityId: user.userId,
                newData: { reason: 'OTP expired' },
            });

            return NextResponse.json(
                { message: 'Password reset link has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // 5. All validations passed - proceed with password reset
        const hashedPassword = await hashPassword(password);

        // Update user password and clear reset token
        await db
            .update(users)
            .set({
                passwordHash: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            })
            .where(eq(users.id, user.userId));

        // Mark OTP as used
        await db
            .update(otpVerifications)
            .set({
                used: true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(otpVerifications.id, otpCheck[0].id));

        // Log successful password reset
        await createAuditLog({
            userId: user.userId,
            action: "PASSWORD_RESET_COMPLETED",
            entityType: "user",
            entityId: user.userId,
            newData: { email: user.email },
        });

        return NextResponse.json({
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { message: 'Internal server error. Please try again later.' },
            { status: 500 }
        );
    }
}