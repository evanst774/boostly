// src/app/api/auth/sudo/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { sudoSessions, otpVerifications } from '@/lib/db/schema/auth';
import { users } from '@/lib/db/schema/users';
import { eq, and, gt } from 'drizzle-orm';
import { verifyTOTPCode } from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, method = 'EMAIL', sessionId } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 },
      );
    }

    // Get the sudo session (even unverified ones)
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

    let isValid = false;

    if (method === 'EMAIL') {
      // Verify OTP
      const otpRecord = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.code, code),
          eq(otpVerifications.type, 'SUDO_VERIFICATION'),
          eq(otpVerifications.used, false),
          gt(otpVerifications.expiresAt, new Date().toISOString()),
        ),
      });

      if (otpRecord) {
        isValid = true;
        // Mark OTP as used
        await db
          .update(otpVerifications)
          .set({ used: true })
          .where(eq(otpVerifications.id, otpRecord.id));
      }
    } else if (method === 'TOTP') {
      // Verify TOTP
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      });

      if (userRecord?.totpSecret) {
        isValid = await verifyTOTPCode(
          userRecord.totpSecret,
          code,
          userRecord.email,
        );
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 },
      );
    }

    // Only now set isVerified to true and update verifiedAt
    await db
      .update(sudoSessions)
      .set({
        verifiedAt: new Date().toISOString(),
        isVerified: true,
      })
      .where(eq(sudoSessions.id, session.id));

    return NextResponse.json({
      success: true,
      message: 'Sudo mode verified successfully',
      expiresAt: session.expiresAt,
      isVerified: true,
    });
  } catch (error) {
    console.error('Sudo verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
