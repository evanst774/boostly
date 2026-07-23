// src/app/api/auth/sudo/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { sudoSettings, otpVerifications } from '@/lib/db/schema/auth';
import { users } from '@/lib/db/schema/users';
import { eq, and, gt } from 'drizzle-orm';
import { sendEmail, buildSudoOTPEmailHTML } from '@/lib/mail';
import { verifyTOTPCode } from '@/lib/totp';
import crypto from 'crypto';
import type {
  SudoMethod,
  SudoSettingsData,
} from '@/types/sudo';

// ─── Fetch sudo settings for the current user ──────────────────────────

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getUserPermissions(user.id);
    const canManageSudo =
      permissions.includes('*') ||
      permissions.includes(PermissionKeys.SYSTEM_CONFIG) ||
      permissions.includes(PermissionKeys.SUDO_MANAGE);

    if (!canManageSudo) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await db.query.sudoSettings.findFirst({
      where: eq(sudoSettings.userId, user.id),
    });

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const enabledMethods = (userRecord?.twoFAEnabledMethods ??
      []) as SudoMethod[];
    const availableMethods: SudoMethod[] = [];

    if (enabledMethods.includes('EMAIL') && userRecord?.emailVerifiedAt) {
      availableMethods.push('EMAIL');
    }
    if (enabledMethods.includes('TOTP') && userRecord?.totpSecret) {
      availableMethods.push('TOTP');
    }

    // FIX: always return a complete settings object, with sane defaults
    // when the user hasn't configured sudo mode yet. Returning a partial
    // object here was causing the client to send NaN values on save.
    const responseSettings: SudoSettingsData = settings
      ? {
          sessionDuration: settings.sessionDuration,
          codeExpiration: settings.codeExpiration,
          isConfigured: true,
        }
      : {
          sessionDuration: 15,
          codeExpiration: 5,
          isConfigured: false,
        };

    return NextResponse.json({
      success: true,
      settings: responseSettings,
      availableMethods,
    });
  } catch (error) {
    console.error('Sudo settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─── POST: Request OTP for sudo settings verification ──────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getUserPermissions(user.id);
    const canManageSudo =
      permissions.includes('*') ||
      permissions.includes(PermissionKeys.SYSTEM_CONFIG) ||
      permissions.includes(PermissionKeys.SUDO_MANAGE);

    if (!canManageSudo) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const method: SudoMethod = body.method ?? 'EMAIL';

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const enabledMethods = (userRecord.twoFAEnabledMethods ??
      []) as SudoMethod[];

    if (method === 'EMAIL') {
      if (!enabledMethods.includes('EMAIL') || !userRecord.emailVerifiedAt) {
        return NextResponse.json(
          { error: 'Email 2FA is not configured for your account' },
          { status: 400 },
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await db
        .delete(otpVerifications)
        .where(
          and(
            eq(otpVerifications.userId, user.id),
            eq(otpVerifications.type, 'SUDO_SETTINGS_VERIFICATION'),
            eq(otpVerifications.used, false),
          ),
        );

      await db.insert(otpVerifications).values({
        id: crypto.randomUUID(),
        userId: user.id,
        code: otp,
        type: 'SUDO_SETTINGS_VERIFICATION',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        used: false,
      });

      await sendEmail({
        to: user.email,
        subject: 'Sudo Settings Verification Code',
        html: buildSudoOTPEmailHTML(user.name || 'User', otp, false, 5),
        type: 'SECURITY',
      });

      return NextResponse.json({
        success: true,
        method: 'EMAIL',
        message: 'Verification code sent to your email',
      });
    } else if (method === 'TOTP') {
      if (!enabledMethods.includes('TOTP') || !userRecord.totpSecret) {
        return NextResponse.json(
          { error: 'TOTP is not configured for your account' },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        method: 'TOTP',
        message: 'Enter your authenticator code',
      });
    }

    return NextResponse.json(
      { error: 'Invalid verification method' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Sudo settings OTP request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─── PUT: Update sudo settings with verification ──────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getUserPermissions(user.id);
    const canManageSudo =
      permissions.includes('*') ||
      permissions.includes(PermissionKeys.SYSTEM_CONFIG) ||
      permissions.includes(PermissionKeys.SUDO_MANAGE);

    if (!canManageSudo) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionDuration, codeExpiration, code } = body;
    const method: SudoMethod = body.method ?? 'EMAIL';

    const sessionDurationNum = Number(sessionDuration);
    const codeExpirationNum = Number(codeExpiration);

    if (Number.isNaN(sessionDurationNum) || Number.isNaN(codeExpirationNum)) {
      return NextResponse.json(
        { error: 'Session duration and code expiration must be valid numbers' },
        { status: 400 },
      );
    }

    const validDurations = [5, 10, 15, 20, 30];
    const validExpirations = [2, 3, 5];

    if (!validDurations.includes(sessionDurationNum)) {
      return NextResponse.json(
        { error: 'Invalid session duration' },
        { status: 400 },
      );
    }

    if (!validExpirations.includes(codeExpirationNum)) {
      return NextResponse.json(
        { error: 'Invalid code expiration' },
        { status: 400 },
      );
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingSettings = await db.query.sudoSettings.findFirst({
      where: eq(sudoSettings.userId, user.id),
    });

    let isValid = false;

    if (method === 'EMAIL') {
      if (!code) {
        return NextResponse.json(
          { error: 'Verification code is required for email method' },
          { status: 400 },
        );
      }

      const otpRecord = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.code, code),
          eq(otpVerifications.type, 'SUDO_SETTINGS_VERIFICATION'),
          eq(otpVerifications.used, false),
          gt(otpVerifications.expiresAt, new Date().toISOString()),
        ),
      });

      if (otpRecord) {
        isValid = true;
        await db
          .update(otpVerifications)
          .set({ used: true })
          .where(eq(otpVerifications.id, otpRecord.id));
      }
    } else if (method === 'TOTP') {
      if (!code) {
        return NextResponse.json(
          { error: 'Verification code is required for TOTP method' },
          { status: 400 },
        );
      }

      if (userRecord.totpSecret) {
        isValid = await verifyTOTPCode(
          userRecord.totpSecret,
          code,
          userRecord.email,
        );
      }
    }

    if (!existingSettings && !isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 },
      );
    }

    if (existingSettings && code && !isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 },
      );
    }

    let settings;
    if (existingSettings) {
      [settings] = await db
        .update(sudoSettings)
        .set({
          sessionDuration: sessionDurationNum,
          codeExpiration: codeExpirationNum,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sudoSettings.userId, user.id))
        .returning();
    } else {
      [settings] = await db
        .insert(sudoSettings)
        .values({
          userId: user.id,
          sessionDuration: sessionDurationNum,
          codeExpiration: codeExpirationNum,
        })
        .returning();
    }

    const responseSettings: SudoSettingsData = {
      sessionDuration: settings.sessionDuration,
      codeExpiration: settings.codeExpiration,
      isConfigured: true,
    };

    return NextResponse.json({
      success: true,
      message: 'Sudo settings updated successfully',
      settings: responseSettings,
    });
  } catch (error) {
    console.error('Sudo settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
