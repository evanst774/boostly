// src/app/api/auth/sudo/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { sudoSessions, otpVerifications } from '@/lib/db/schema/auth';
import { users } from '@/lib/db/schema/users';
import { eq, and, gt, lt } from 'drizzle-orm';
import { sendEmail, buildSudoOTPEmailHTML } from '@/lib/mail';
import crypto from 'crypto';
import { SUDO_CONFIG } from '@/lib/constants/sudo';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { method = 'EMAIL', sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 },
      );
    }

    // Only allow resend for EMAIL method
    if (method !== 'EMAIL') {
      return NextResponse.json(
        { error: 'Resend is only available for email verification' },
        { status: 400 },
      );
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the existing sudo session (must be unverified and not expired)
    const session = await db.query.sudoSessions.findFirst({
      where: and(
        eq(sudoSessions.userId, user.id),
        eq(sudoSessions.id, sessionId),
        eq(sudoSessions.isVerified, false),
        gt(sudoSessions.expiresAt, new Date().toISOString()),
      ),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please request a new one.' },
        { status: 401 },
      );
    }

    const OTP_EXPIRY_DURATION = SUDO_CONFIG.CODE_EXPIRATION_MINUTES * 60 * 1000;
    const SUDO_SESSION_DURATION =
      SUDO_CONFIG.SESSION_DURATION_MINUTES * 60 * 1000;

    // Check if user has exceeded max resend attempts
    const recentOtps = await db.query.otpVerifications.findMany({
      where: and(
        eq(otpVerifications.userId, user.id),
        eq(otpVerifications.type, 'SUDO_VERIFICATION'),
        eq(otpVerifications.used, false),
        gt(
          otpVerifications.createdAt,
          new Date(
            Date.now() - SUDO_CONFIG.RESEND_WINDOW_MINUTES * 60 * 1000,
          ).toISOString(),
        ),
      ),
    });

    if (recentOtps.length >= SUDO_CONFIG.MAX_RESEND_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many resend attempts. Please wait a few minutes.' },
        { status: 429 },
      );
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old unused OTPs for this user (cleanup)
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.type, 'SUDO_VERIFICATION'),
          eq(otpVerifications.used, false),
          lt(
            otpVerifications.createdAt,
            new Date(Date.now() - OTP_EXPIRY_DURATION).toISOString(),
          ),
        ),
      );

    // Store new OTP
    await db.insert(otpVerifications).values({
      id: crypto.randomUUID(),
      userId: user.id,
      code: otp,
      type: 'SUDO_VERIFICATION',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_DURATION).toISOString(),
      used: false,
    });

    // Update session expiry to extend it
    const newExpiry = new Date(Date.now() + SUDO_SESSION_DURATION);
    await db
      .update(sudoSessions)
      .set({
        expiresAt: newExpiry.toISOString(),
      })
      .where(eq(sudoSessions.id, session.id));

    // Send email with new OTP
    await sendEmail({
      to: user.email,
      subject: 'Sudo Mode Verification Code (Resent)',
      html: buildSudoOTPEmailHTML(
        user.name || 'User',
        otp,
        true,
        SUDO_CONFIG.CODE_EXPIRATION_MINUTES,
      ),
      type: 'SUDO_OTP',
    });

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email',
      expiresAt: newExpiry.toISOString(),
    });
  } catch (error) {
    console.error('Sudo resend error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
