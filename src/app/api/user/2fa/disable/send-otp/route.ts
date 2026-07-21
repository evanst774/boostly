// src/app/api/user/2fa/disable/send-otp/route.ts
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

    // Delete old disable OTPs
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.type, '2FA_DISABLE'),
          eq(otpVerifications.used, false),
        ),
      );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.insert(otpVerifications).values({
      id: crypto.randomUUID(),
      userId: user.id,
      code: otp,
      type: '2FA_DISABLE',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });

    await sendEmail({
      to: user.email,
      subject: 'Disable 2FA Verification - MotoTrack',
      html: build2FAOTPEmailHTML(user.name || 'User', otp),
      type: 'VERIFICATION',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', stack: error },
      { status: 500 },
    );
  }
}
