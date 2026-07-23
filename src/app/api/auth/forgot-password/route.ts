// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { otpVerifications } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import { sendEmail, buildPasswordResetEmailHTML } from '@/lib/mail';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user[0]) {
            // Don't reveal that user doesn't exist for security
            return NextResponse.json({ message: 'If an account exists, a reset link will be sent' });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to user
        await db
            .update(users)
            .set({
                passwordResetToken: token,
                passwordResetExpires: expiresAt.toISOString(),
            })
            .where(eq(users.id, user[0].id));

        // Create OTP verification record (using otpVerifications table)
        await db.insert(otpVerifications).values({
            id: crypto.randomUUID(),
            userId: user[0].id,
            code: token,
            type: 'PASSWORD_RESET',
            expiresAt: expiresAt.toISOString(),
            used: false,
        });

        // Send reset email
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
        const emailHtml = buildPasswordResetEmailHTML(user[0].name || user[0].email.split('@')[0], resetUrl);

        await sendEmail({
            to: user[0].email,
            subject: 'Reset Your Password - MotoTrack',
            html: emailHtml,
            type: 'PASSWORD_RESET',
        });

        return NextResponse.json({ message: 'If an account exists, a reset link will be sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}