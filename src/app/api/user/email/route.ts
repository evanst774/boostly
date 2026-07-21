// src/app/api/user/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users, otpVerifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from '@/lib/db/auth-utils';
import { sendEmail, build2FAOTPEmailHTML } from '@/lib/mail';
import { createAuditLog } from '@/lib/audit';

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { newEmail, password, otp, action } = await request.json();

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    if (!userRecord)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!userRecord.passwordHash)
      return NextResponse.json(
        { error: 'This account has no password set (OAuth-only)' },
        { status: 400 },
      );

    const isPasswordValid = await verifyPassword(
      password,
      userRecord.passwordHash,
    );
    if (!isPasswordValid)
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 },
      );

    if (action === 'send_otp') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await db
        .delete(otpVerifications)
        .where(
          and(
            eq(otpVerifications.userId, user.id),
            eq(otpVerifications.type, 'EMAIL_VERIFICATION'),
          ),
        );
      await db.insert(otpVerifications).values({
        id: crypto.randomUUID(),
        userId: user.id,
        code,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      });
      await sendEmail({
        to: newEmail,
        subject: 'Verify Your New Email - MotoTrack',
        html: build2FAOTPEmailHTML(userRecord.name || 'User', code),
        type: 'VERIFICATION',
      });
      return NextResponse.json({
        success: true,
        message: 'Verification code sent',
      });
    }

    if (action === 'verify_otp') {
      const otpRecord = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.code, otp),
          eq(otpVerifications.type, 'EMAIL_VERIFICATION'),
          eq(otpVerifications.used, false),
        ),
      });
      if (!otpRecord || new Date(otpRecord.expiresAt) < new Date())
        return NextResponse.json(
          { error: 'Invalid or expired code' },
          { status: 400 },
        );

      await db
        .update(otpVerifications)
        .set({ used: true })
        .where(eq(otpVerifications.id, otpRecord.id));
      await db
        .update(users)
        .set({ email: newEmail, updatedAt: new Date().toISOString() })
        .where(eq(users.id, user.id));
      await createAuditLog({
        userId: user.id,
        action: 'EMAIL_CHANGED',
        entityType: 'user',
        entityId: user.id,
        newData: { oldEmail: user.email, newEmail },
      });

      return NextResponse.json({ success: true, message: 'Email updated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', stack: error },
      { status: 500 },
    );
  }
}
