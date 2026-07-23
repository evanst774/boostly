// src/app/api/auth/verify-email/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { otpVerifications } from '@/lib/db/schema/auth';
import { sendEmail, build2FAOTPEmailHTML } from '@/lib/mail';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 },
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Don't reveal user doesn't exist for security
      return NextResponse.json(
        { message: 'If an account exists, a verification code will be sent' },
        { status: 200 },
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 400 },
      );
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Delete old unused OTPs for this user
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.type, 'EMAIL_VERIFICATION'),
          eq(otpVerifications.used, false),
        ),
      );

    // Store new OTP
    await db.insert(otpVerifications).values({
      userId: user.id,
      code: otpCode,
      type: 'EMAIL_VERIFICATION',
      expiresAt: expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Send email with OTP code
    const emailHtml = build2FAOTPEmailHTML(
      user.name || user.email.split('@')[0],
      otpCode,
    );

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - MotoTrack',
      html: emailHtml,
      type: 'VERIFICATION',
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 600,
    });
  } catch (error) {
    console.error('Request verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
