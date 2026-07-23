// src/app/api/auth/sudo/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { sudoSessions, otpVerifications } from '@/lib/db/schema/auth';
import { users } from '@/lib/db/schema/users';
import { eq, and, lt, gt } from 'drizzle-orm';
import { sendEmail, buildSudoOTPEmailHTML } from '@/lib/mail';
import crypto from 'crypto';
import { SUDO_CONFIG } from '@/lib/constants/sudo';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { method = 'EMAIL' } = body;

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const SUDO_SESSION_DURATION =
      SUDO_CONFIG.SESSION_DURATION_MINUTES * 60 * 1000;
    const OTP_EXPIRY_DURATION = SUDO_CONFIG.CODE_EXPIRATION_MINUTES * 60 * 1000;

    // Clean up expired sudo sessions
    await db
      .delete(sudoSessions)
      .where(lt(sudoSessions.expiresAt, new Date().toISOString()));

    // Check for existing valid AND VERIFIED sudo session
    const existingSession = await db.query.sudoSessions.findFirst({
      where: and(
        eq(sudoSessions.userId, user.id),
        eq(sudoSessions.isVerified, true),
        gt(sudoSessions.expiresAt, new Date().toISOString()),
      ),
    });

    if (existingSession) {
      // Extend existing verified session
      const newExpiry = new Date(Date.now() + SUDO_SESSION_DURATION);
      await db
        .update(sudoSessions)
        .set({
          expiresAt: newExpiry.toISOString(),
        })
        .where(eq(sudoSessions.id, existingSession.id));

      return NextResponse.json({
        success: true,
        message: 'Sudo session extended',
        expiresAt: newExpiry.toISOString(),
        isVerified: true,
        durationMinutes: SUDO_CONFIG.SESSION_DURATION_MINUTES,
      });
    }

    // Generate new sudo session token
    const token = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const expiryDate = new Date(Date.now() + SUDO_SESSION_DURATION);

    // Create sudo session with isVerified = false (pending verification)
    await db.insert(sudoSessions).values({
      id: sessionId,
      userId: user.id,
      token,
      expiresAt: expiryDate.toISOString(),
      verifiedAt: null,
      isVerified: false,
    });

    // Send OTP based on method
    if (method === 'EMAIL') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await db
        .delete(otpVerifications)
        .where(
          and(
            eq(otpVerifications.userId, user.id),
            eq(otpVerifications.type, 'SUDO_VERIFICATION'),
            eq(otpVerifications.used, false),
          ),
        );

      await db.insert(otpVerifications).values({
        id: crypto.randomUUID(),
        userId: user.id,
        code: otp,
        type: 'SUDO_VERIFICATION',
        expiresAt: new Date(Date.now() + OTP_EXPIRY_DURATION).toISOString(),
        used: false,
      });

      await sendEmail({
        to: user.email,
        subject: 'Sudo Mode Verification Code',
        html: buildSudoOTPEmailHTML(
          user.name || 'User',
          otp,
          false,
          SUDO_CONFIG.CODE_EXPIRATION_MINUTES,
        ),
        type: 'SUDO_OTP',
      });

      return NextResponse.json({
        success: true,
        method: 'EMAIL',
        message: 'OTP sent to your email',
        sessionId,
        isVerified: false,
        durationMinutes: SUDO_CONFIG.SESSION_DURATION_MINUTES,
        codeExpirationMinutes: SUDO_CONFIG.CODE_EXPIRATION_MINUTES,
      });
    } else if (method === 'TOTP') {
      return NextResponse.json({
        success: true,
        method: 'TOTP',
        message: 'Enter your authenticator code',
        sessionId,
        isVerified: false,
        durationMinutes: SUDO_CONFIG.SESSION_DURATION_MINUTES,
        codeExpirationMinutes: SUDO_CONFIG.CODE_EXPIRATION_MINUTES,
      });
    }

    return NextResponse.json(
      { error: 'Invalid verification method' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Sudo request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
