// src/app/api/user/2fa/email/setup/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { otpVerifications } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { sendEmail, build2FAOTPEmailHTML } from '@/lib/mail';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Delete any existing unused 2FA_SETUP OTPs
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.type, '2FA_SETUP'),
          eq(otpVerifications.used, false),
        ),
      );

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.insert(otpVerifications).values({
      id: crypto.randomUUID(),
      userId: user.id,
      code: otp,
      type: '2FA_SETUP',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject: '2FA Setup Verification - MotoTrack',
      html: build2FAOTPEmailHTML(user.name || 'User', otp),
      type: 'VERIFICATION',
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Error sending 2FA OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error', stack: error },
      { status: 500 },
    );
  }
}
