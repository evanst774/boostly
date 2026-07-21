// src/app/api/user/2fa/disable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users, otpVerifications } from '@/lib/db/schema';
import { sudoSettings, sudoSessions } from '@/lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { verifyTOTPCode } from '@/lib/totp';

type TwoFAMethod = 'EMAIL' | 'TOTP';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { method, code } = await request.json();

    if (!method || !['EMAIL', 'TOTP'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid method. Must be EMAIL or TOTP' },
        { status: 400 },
      );
    }

    const methodToRemove = method as TwoFAMethod;

    // ── VERIFICATION REQUIRED ──────────────────────
    if (!code) {
      return NextResponse.json(
        { error: 'Verification code required to disable 2FA' },
        { status: 400 },
      );
    }

    // Verify based on method being removed
    if (methodToRemove === 'EMAIL') {
      // Verify via OTP sent to email
      const otpRecord = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.code, code),
          eq(otpVerifications.type, '2FA_DISABLE'),
          eq(otpVerifications.used, false),
        ),
      });
      if (!otpRecord || new Date(otpRecord.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: 'Invalid or expired verification code' },
          { status: 400 },
        );
      }
      await db
        .update(otpVerifications)
        .set({ used: true })
        .where(eq(otpVerifications.id, otpRecord.id));
    } else if (methodToRemove === 'TOTP') {
      // Verify via TOTP code OR backup code
      const record = await db
        .select({
          totpSecret: users.totpSecret,
          totpBackupCodes: users.totpBackupCodes,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      let isValid = false;

      // Try TOTP code first
      if (record[0]?.totpSecret) {
        isValid = await verifyTOTPCode(record[0].totpSecret, code, user.email);
      }

      // If TOTP fails, try backup codes
      if (!isValid && record[0]?.totpBackupCodes) {
        try {
          const backups: string[] = JSON.parse(
            record[0].totpBackupCodes as string,
          );
          const idx = backups.indexOf(code);
          if (idx !== -1) {
            isValid = true;
            // Remove used backup code
            backups.splice(idx, 1);
            await db
              .update(users)
              .set({ totpBackupCodes: JSON.stringify(backups) })
              .where(eq(users.id, user.id));
          }
        } catch {
          /* ignore parse errors */
        }
      }

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code or backup code' },
          { status: 400 },
        );
      }
    }

    // ── PROCEED WITH DISABLE ───────────────────────
    const record = await db
      .select({
        twoFAEnabledMethods: users.twoFAEnabledMethods,
        twoFADefaultMethod: users.twoFADefaultMethod,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    let methods: TwoFAMethod[] = [];
    if (
      record[0]?.twoFAEnabledMethods &&
      Array.isArray(record[0].twoFAEnabledMethods)
    ) {
      methods = record[0].twoFAEnabledMethods.filter(
        (m): m is TwoFAMethod => m === 'EMAIL' || m === 'TOTP',
      );
    }

    methods = methods.filter((m) => m !== methodToRemove);

    let defaultMethod: TwoFAMethod | null = null;
    const currentDefault = record[0]?.twoFADefaultMethod;
    if (currentDefault === 'EMAIL' || currentDefault === 'TOTP') {
      defaultMethod =
        currentDefault === methodToRemove ? methods[0] || null : currentDefault;
    } else {
      defaultMethod = methods.length > 0 ? methods[0] : null;
    }

    const updateData: Record<string, unknown> = {
      twoFAEnabledMethods: methods,
      twoFADefaultMethod: defaultMethod,
      is2FAEnabled: methods.length > 0,
      updatedAt: new Date().toISOString(),
    };

    if (methodToRemove === 'TOTP') {
      updateData.totpSecret = null;
      updateData.totpBackupCodes = null;
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));

    // ─── CRITICAL: Clean up sudo mode if NO 2FA methods remain ──────
    if (methods.length === 0) {
      // Delete sudo settings
      await db.delete(sudoSettings).where(eq(sudoSettings.userId, user.id));

      // Delete any active sudo sessions
      await db
        .delete(sudoSessions)
        .where(
          and(
            eq(sudoSessions.userId, user.id),
            eq(sudoSessions.isVerified, true),
          ),
        );

      console.log(
        `🔒 Sudo mode automatically disabled for user ${user.id} (all 2FA methods removed)`,
      );
    } else {
      // If TOTP was removed but other methods remain, check if TOTP was the default
      if (methodToRemove === 'TOTP' && methods.length > 0) {
        // If TOTP was the default, set the first available method as default
        if (currentDefault === 'TOTP') {
          await db
            .update(users)
            .set({ twoFADefaultMethod: methods[0] as TwoFAMethod })
            .where(eq(users.id, user.id));
        }
      }
    }

    // ─── Return response ──────────────────────────────────────────────

    const responseMessage =
      methods.length === 0
        ? `${methodToRemove} 2FA disabled. Sudo mode has been automatically disabled because no 2FA methods remain.`
        : `${methodToRemove} 2FA disabled`;

    return NextResponse.json({
      success: true,
      message: responseMessage,
      twoFAEnabled: methods.length > 0,
      remainingMethods: methods,
      sudoDisabled: methods.length === 0,
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
