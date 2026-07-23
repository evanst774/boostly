// src/app/api/auth/verify-email/confirm/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { otpVerifications } from '@/lib/db/schema/auth';
import { createAuditLog } from '@/lib/audit';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, token } = body;

    // At least one of code or token must be provided
    if (!email || (!code && !token)) {
      return NextResponse.json(
        { message: 'Email and verification code or token are required' },
        { status: 400 },
      );
    }

    // ── Find user ──────────────────────────────────────
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 404 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 400 },
      );
    }

    // ── Check if account is locked ────────────────────
    if (
      user.verificationLockedUntil &&
      new Date(user.verificationLockedUntil) > new Date()
    ) {
      const minutesLeft = Math.ceil(
        (new Date(user.verificationLockedUntil).getTime() - Date.now()) / 60000,
      );
      return NextResponse.json(
        {
          message: `Too many failed attempts. Try again in ${minutesLeft} minutes.`,
        },
        { status: 429 },
      );
    }

    let isVerified = false;

    // ── Method 1: Token verification (from email link) ──
    if (token) {
      if (user.emailVerificationToken === token) {
        isVerified = true;
      }
    }

    // ── Method 2: OTP code verification ──────────────
    if (!isVerified && code) {
      // Find valid OTP
      const otpRecord = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.code, code),
          eq(otpVerifications.type, 'EMAIL_VERIFICATION'),
          eq(otpVerifications.used, false),
        ),
      });

      if (otpRecord && new Date(otpRecord.expiresAt) > new Date()) {
        isVerified = true;

        // Mark OTP as used
        await db
          .update(otpVerifications)
          .set({ used: true, updatedAt: new Date().toISOString() })
          .where(eq(otpVerifications.id, otpRecord.id));
      }
    }

    // ── Handle verification result ────────────────────
    if (!isVerified) {
      // ============================================
      // FIX: this used to count *rows* in otp_verifications
      // (how many unused codes exist for this user in the last
      // 15 minutes) as a stand-in for failed attempts:
      //
      //   const recentAttempts = await db.select({ count: sql`count(*)` })...
      //   if (Number(recentAttempts[0]?.count) >= MAX_ATTEMPTS) { ...lock... }
      //
      // That doesn't track guesses at all. /verify-email/request
      // deletes the previous unused code before inserting a new
      // one, so there is normally exactly one unused row per user
      // at any time — and a wrong guess doesn't create a new row,
      // it just leaves that same row untouched. So the count sat
      // at 1 forever no matter how many wrong codes were submitted,
      // and the 5-attempt lockout effectively never engaged —
      // someone could brute-force a 6-digit code against this
      // endpoint indefinitely.
      //
      // Fixed by using users.failedVerificationAttempts, a column
      // that already existed in the schema for exactly this
      // purpose but was never being written to. Incremented here
      // on every failed guess, reset to 0 whenever a fresh code is
      // requested (see verify-email/request/route.ts) or on
      // successful verification below.
      // ============================================
      const newAttemptCount = (user.failedVerificationAttempts ?? 0) + 1;
      const lockingNow = newAttemptCount >= MAX_ATTEMPTS;

      await db
        .update(users)
        .set({
          failedVerificationAttempts: lockingNow ? 0 : newAttemptCount,
          verificationLockedUntil: lockingNow
            ? new Date(Date.now() + LOCKOUT_DURATION).toISOString()
            : user.verificationLockedUntil,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, user.id));

      // Log failed attempt
      await createAuditLog({
        userId: user.id,
        action: 'VERIFICATION_FAILED',
        entityType: 'user',
        entityId: user.id,
        newData: {
          reason: 'Invalid or expired verification',
          method: code ? 'OTP' : 'TOKEN',
          attempt: newAttemptCount,
        },
      });

      if (lockingNow) {
        return NextResponse.json(
          {
            message:
              'Too many failed attempts. Please request a new code in 15 minutes.',
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { message: 'Invalid or expired verification code or link' },
        { status: 400 },
      );
    }

    // ── Mark user as verified ──────────────────────────
    await db
      .update(users)
      .set({
        emailVerifiedAt: new Date().toISOString(),
        isActive: true,
        emailVerificationToken: null,
        verificationLockedUntil: null,
        failedVerificationAttempts: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    // Log successful verification
    await createAuditLog({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      entityType: 'user',
      entityId: user.id,
      newData: {
        email: user.email,
        method: code ? 'OTP' : 'TOKEN',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Confirm verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
