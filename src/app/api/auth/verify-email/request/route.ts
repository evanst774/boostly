// src/app/api/auth/verify-email/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { otpVerifications } from '@/lib/db/schema/auth';
import { sendEmail, build2FAOTPEmailHTML } from '@/lib/mail';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// ============================================
// FIX: crypto.randomInt, not Math.random. Same reasoning
// register/route.ts already applies to its own OTP generator
// ("an OTP from a predictable PRNG is guessable") — this was
// the one remaining verification-code path still using
// Math.random.
// ============================================
function generateOTP(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

// Mirrors the 60s countdown already shown client-side on the
// verify-email page — enforced here too since the UI timer alone
// is trivially bypassed by calling this endpoint directly.
const RESEND_COOLDOWN_MS = 60 * 1000;

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

    // ============================================
    // FIX: respect the same lockout confirm/route.ts enforces.
    // Previously this endpoint would happily mint a fresh code
    // for a user who was locked out for too many failed
    // guesses, defeating the point of the cooldown.
    // ============================================
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

    // ============================================
    // FIX: server-side resend cooldown. There was no throttle
    // here at all before — only the client-side 60s countdown
    // on the verify-email page, which anyone calling this API
    // directly could ignore entirely.
    // ============================================
    const existingUnusedOtp = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.userId, user.id),
        eq(otpVerifications.type, 'EMAIL_VERIFICATION'),
        eq(otpVerifications.used, false),
      ),
    });

    if (existingUnusedOtp) {
      const elapsed =
        Date.now() - new Date(existingUnusedOtp.createdAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            message: `Please wait ${secondsLeft}s before requesting another code.`,
          },
          { status: 429 },
        );
      }
    }

    // Generate 6-digit OTP code
    const otpCode = generateOTP();
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

    // ============================================
    // FIX: a fresh code deserves a fresh set of attempts.
    // Reset the failed-attempt counter (see the matching fix
    // in verify-email/confirm/route.ts) so someone who
    // mistyped an old, now-discarded code a couple of times
    // isn't already partway toward a lockout on a code they
    // no longer have.
    // ============================================
    await db
      .update(users)
      .set({ failedVerificationAttempts: 0 })
      .where(eq(users.id, user.id));

    // Send email with OTP code
    const emailHtml = build2FAOTPEmailHTML(
      user.name || user.email.split('@')[0],
      otpCode,
    );

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Boostly',
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
