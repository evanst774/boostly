// src/app/api/auth/resend-2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, otpVerifications, twoFASessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Generate and send OTP for email 2FA
async function sendEmailOTP(
  userId: string,
  email: string,
  name: string | null,
) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .delete(otpVerifications)
    .where(
      and(
        eq(otpVerifications.userId, userId),
        eq(otpVerifications.type, '2FA_LOGIN'),
        eq(otpVerifications.used, false),
      ),
    );

  await db.insert(otpVerifications).values({
    id: crypto.randomUUID(),
    userId,
    code: otp,
    type: '2FA_LOGIN',
    expiresAt: expiresAt.toISOString(),
    used: false,
  });

  const { sendEmail, build2FAOTPEmailHTML } = await import('@/lib/mail');
  await sendEmail({
    to: email,
    subject: 'Your 2FA Verification Code',
    html: build2FAOTPEmailHTML(name || 'User', otp),
    type: 'VERIFICATION',
  });

  return otp;
}

// Verify session exists
async function verifySession(sessionId: string): Promise<string | null> {
  const session = await db
    .select()
    .from(twoFASessions)
    .where(eq(twoFASessions.id, sessionId))
    .limit(1);

  if (!session[0] || new Date(session[0].expiresAt) < new Date()) {
    return null;
  }

  return session[0].userId;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email } = await request.json();

    if (!sessionId && !email) {
      return NextResponse.json(
        { message: 'Session ID or email is required' },
        { status: 400 },
      );
    }

    let userId: string | null = null;
    let userEmail = '';
    let userName = null;

    // If sessionId is provided, use it to get user
    if (sessionId) {
      userId = await verifySession(sessionId);
      if (!userId) {
        return NextResponse.json(
          { message: 'Session expired or invalid. Please login again.' },
          { status: 401 },
        );
      }

      // Get user details
      const user = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user[0]) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 },
        );
      }

      userEmail = user[0].email;
      userName = user[0].name;
    }
    // Fallback to email lookup (for backward compatibility)
    else if (email) {
      const user = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user[0]) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 },
        );
      }

      userId = user[0].id;
      userEmail = user[0].email;
      userName = user[0].name;
    }

    if (!userId) {
      return NextResponse.json(
        { message: 'Unable to identify user' },
        { status: 400 },
      );
    }

    // Send new OTP
    await sendEmailOTP(userId, userEmail, userName);

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email',
    });
  } catch (error) {
    console.error('Error resending 2FA code:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
