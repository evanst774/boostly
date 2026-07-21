// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, otpVerifications, twoFASessions } from '@/lib/db/schema';
import { userRoles, roles } from '@/lib/db/schema/rbac';
import { auditLogs, AuditAction, AuditEntityType } from '@/lib/db/schema/audit';
import { eq, and, lt } from 'drizzle-orm';
import { verifyPassword, createAuthToken } from '@/lib/db/auth-utils';
import {
  getRoleRedirectPath,
  JWT_EXPIRY_SECONDS,
  JWT_COOKIE_NAME,
} from '@/lib/jwt';
import { verifyTOTPCode } from '@/lib/totp';
import { parseEnabledMethods } from '@/lib/utils';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = JWT_COOKIE_NAME;

// ─── helpers ────────────────────────────────────────────────

async function getUserRoleNames(userId: string): Promise<string[]> {
  const rows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  return rows.map((r) => r.roleName);
}

async function getPrimaryRoleForRedirect(userId: string): Promise<string> {
  const names = await getUserRoleNames(userId);
  return names[0] || 'SALES_PERSON';
}

async function cleanupExpiredOTPs() {
  await db
    .delete(otpVerifications)
    .where(lt(otpVerifications.expiresAt, new Date().toISOString()));
}

async function cleanupExpiredTwoFASessions() {
  await db
    .delete(twoFASessions)
    .where(lt(twoFASessions.expiresAt, new Date().toISOString()));
}

async function create2FASession(userId: string): Promise<string> {
  await cleanupExpiredTwoFASessions();
  const id = crypto.randomUUID();
  await db.insert(twoFASessions).values({
    id,
    userId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  return id;
}

async function verify2FASession(sessionId: string): Promise<string | null> {
  const [s] = await db
    .select()
    .from(twoFASessions)
    .where(eq(twoFASessions.id, sessionId))
    .limit(1);
  if (!s || new Date(s.expiresAt) < new Date()) return null;
  await db.delete(twoFASessions).where(eq(twoFASessions.id, sessionId));
  return s.userId;
}

async function sendEmailOTP(
  userId: string,
  email: string,
  name: string | null,
): Promise<void> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
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
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false,
  });
  const { sendEmail, build2FAOTPEmailHTML } = await import('@/lib/mail');
  await sendEmail({
    to: email,
    subject: 'Your 2FA Verification Code - MotoTrack',
    html: build2FAOTPEmailHTML(name || 'User', otp),
    type: 'VERIFICATION',
  });
}

function resolveEnabledMethods(data: {
  twoFAEnabledMethods?: unknown;
  twoFAMethod?: string | null;
  is2FAEnabled?: boolean | null;
}): ('EMAIL' | 'TOTP')[] {
  const parsed = parseEnabledMethods(data.twoFAEnabledMethods);
  if (parsed.length > 0) return parsed;
  if (data.is2FAEnabled && data.twoFAMethod) {
    const m = data.twoFAMethod as 'EMAIL' | 'TOTP';
    if (m === 'EMAIL' || m === 'TOTP') return [m];
  }
  return [];
}

// Define the audit log entry interface
interface AuditEntry {
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  newData?: Record<string, unknown>;
}

function audit(overrides: AuditEntry, req: NextRequest, userId?: string) {
  return db.insert(auditLogs).values({
    userId: userId || null,
    action: overrides.action,
    entityType: overrides.entityType || null,
    entityId: overrides.entityId || null,
    newData: JSON.stringify(overrides.newData || {}),
    ipAddress:
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  });
}

// ─── POST ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      otpCode,
      is2FAStep,
      method: selectedMethod,
      sessionId,
      isBackupCode,
    } = body as {
      email?: string;
      password?: string;
      otpCode?: string;
      is2FAStep?: boolean;
      method?: 'EMAIL' | 'TOTP';
      sessionId?: string;
      isBackupCode?: boolean;
    };

    if (!email || (!is2FAStep && !password)) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 },
      );
    }

    // ── find user ──────────────────────────────────
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!userData) {
      await audit(
        {
          action: 'LOGIN_FAILED',
          newData: { email, reason: 'User not found' },
        },
        request,
      );
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const roleNames = await getUserRoleNames(userData.id);
    const isSuper = roleNames.includes('SUPER_ADMIN');

    // ── locked? ────────────────────────────────────
    if (
      userData.accountLockedUntil &&
      new Date(userData.accountLockedUntil) > new Date()
    ) {
      const mins = Math.ceil(
        (new Date(userData.accountLockedUntil).getTime() - Date.now()) / 60000,
      );
      await audit(
        {
          action: 'LOGIN_FAILED',
          entityType: 'user',
          entityId: userData.id,
          newData: { email, reason: 'Account locked' },
        },
        request,
        userData.id,
      );
      return NextResponse.json(
        { message: `Account locked. Try again in ${mins} minutes.` },
        { status: 401 },
      );
    }

    // ── email verified? ────────────────────────────
    if (!userData.emailVerifiedAt && !isSuper) {
      return NextResponse.json(
        {
          message: 'Please verify your email before logging in',
          needsVerification: true,
          email: userData.email,
        },
        { status: 401 },
      );
    }

    // ── active? ────────────────────────────────────
    if (!userData.isActive && !isSuper) {
      await audit(
        {
          action: 'LOGIN_FAILED',
          entityType: 'user',
          entityId: userData.id,
          newData: { email, reason: 'Account deactivated' },
        },
        request,
        userData.id,
      );
      return NextResponse.json(
        { message: 'Account deactivated. Contact support.' },
        { status: 401 },
      );
    }

    await cleanupExpiredOTPs();

    // ════════════════════════════════════════════════
    // STEP 2 — 2FA verification
    // ════════════════════════════════════════════════
    if (is2FAStep) {
      if (!sessionId || !otpCode) {
        return NextResponse.json(
          {
            message: !sessionId
              ? 'Invalid session. Please login again.'
              : 'Verification code is required',
          },
          { status: 401 },
        );
      }

      const verifiedUserId = await verify2FASession(sessionId);
      if (!verifiedUserId || verifiedUserId !== userData.id) {
        return NextResponse.json(
          { message: 'Session expired. Please login again.' },
          { status: 401 },
        );
      }

      const enabled = resolveEnabledMethods(userData);
      if (enabled.length === 0)
        return NextResponse.json(
          { message: '2FA not configured. Contact support.' },
          { status: 400 },
        );

      const method: 'EMAIL' | 'TOTP' =
        selectedMethod ??
        (userData.twoFADefaultMethod as 'EMAIL' | 'TOTP') ??
        enabled[0];
      if (!enabled.includes(method))
        return NextResponse.json(
          { message: 'Selected method is not enabled.' },
          { status: 400 },
        );

      let isValid = false;

      // ── TOTP ────────────────────────────────────
      if (method === 'TOTP') {
        // ── backup code path ────────────────────
        if (isBackupCode) {
          if (!userData.totpBackupCodes) {
            return NextResponse.json(
              { message: 'No backup codes available' },
              { status: 400 },
            );
          }
          let backups: string[];
          try {
            backups = JSON.parse(userData.totpBackupCodes as string);
          } catch {
            return NextResponse.json(
              { message: 'Invalid backup codes format' },
              { status: 500 },
            );
          }

          const idx = backups.indexOf(otpCode);
          if (idx === -1) {
            await audit(
              {
                action: 'LOGIN_FAILED',
                entityType: 'user',
                entityId: userData.id,
                newData: { email, reason: 'Invalid backup code', method },
              },
              request,
              userData.id,
            );
            return NextResponse.json(
              { message: 'Invalid backup code' },
              { status: 400 },
            );
          }
          // consume the backup code
          backups.splice(idx, 1);
          await db
            .update(users)
            .set({
              totpBackupCodes: JSON.stringify(backups),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, userData.id));
          isValid = true;
        } else {
          // ── normal TOTP ─────────────────────
          if (!userData.totpSecret) {
            return NextResponse.json(
              { message: 'Authenticator not configured. Contact support.' },
              { status: 400 },
            );
          }
          isValid = await verifyTOTPCode(
            userData.totpSecret,
            otpCode,
            userData.email,
          );
        }
      } else {
        // ── EMAIL OTP ───────────────────────────
        const [stored] = await db
          .select()
          .from(otpVerifications)
          .where(
            and(
              eq(otpVerifications.userId, userData.id),
              eq(otpVerifications.code, otpCode),
              eq(otpVerifications.type, '2FA_LOGIN'),
              eq(otpVerifications.used, false),
            ),
          )
          .limit(1);
        if (stored && new Date(stored.expiresAt) >= new Date()) {
          isValid = true;
          await db
            .update(otpVerifications)
            .set({ used: true, updatedAt: new Date().toISOString() })
            .where(eq(otpVerifications.id, stored.id));
        }
      }

      if (!isValid) {
        await audit(
          {
            action: 'LOGIN_FAILED',
            entityType: 'user',
            entityId: userData.id,
            newData: { email, reason: 'Invalid 2FA code', method },
          },
          request,
          userData.id,
        );
        return NextResponse.json(
          { message: 'Invalid verification code.' },
          { status: 400 },
        );
      }

      // ── success ────────────────────────────────
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLoginAt: new Date().toISOString(),
        })
        .where(eq(users.id, userData.id));

      const token = await createAuthToken(userData.id);
      const redirectPath = getRoleRedirectPath(
        await getPrimaryRoleForRedirect(userData.id),
      );

      await audit(
        {
          action: 'LOGIN',
          entityType: 'user',
          entityId: userData.id,
          newData: {
            email: userData.email,
            method: '2FA',
            type: isBackupCode ? 'TOTP_BACKUP' : method,
          },
        },
        request,
        userData.id,
      );

      const resp = NextResponse.json({
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          roles: roleNames,
          emailVerified: !!userData.emailVerifiedAt,
          isActive: userData.isActive,
        },
        redirectTo: redirectPath,
      });
      resp.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: JWT_EXPIRY_SECONDS,
        path: '/',
      });
      return resp;
    }

    // ════════════════════════════════════════════════
    // STEP 1 — password check
    // ════════════════════════════════════════════════
    if (!userData.passwordHash) {
      return NextResponse.json(
        { error: 'This account signs in with a social provider. Please use that instead.' },
        { status: 400 },
      );
    }
    const pwOk = await verifyPassword(password!, userData.passwordHash);
    if (!pwOk) {
      const attempts = (userData.failedLoginAttempts ?? 0) + 1;
      const locked =
        attempts >= 5
          ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
          : null;
      await db
        .update(users)
        .set({ failedLoginAttempts: attempts, accountLockedUntil: locked })
        .where(eq(users.id, userData.id));
      await audit(
        {
          action: 'LOGIN_FAILED',
          entityType: 'user',
          entityId: userData.id,
          newData: { email, attempts },
        },
        request,
        userData.id,
      );
      return NextResponse.json(
        {
          message:
            attempts >= 5
              ? 'Too many attempts. Account locked for 15 minutes.'
              : 'Invalid credentials',
        },
        { status: 401 },
      );
    }

    // ════════════════════════════════════════════════
    // 2FA required?
    // ════════════════════════════════════════════════
    if (userData.is2FAEnabled === true) {
      const enabled = resolveEnabledMethods(userData);
      if (enabled.length === 0)
        return NextResponse.json(
          { message: '2FA enabled but no methods. Contact support.' },
          { status: 400 },
        );

      const defMethod =
        (userData.twoFADefaultMethod as 'EMAIL' | 'TOTP') ?? enabled[0];
      const sessId = await create2FASession(userData.id);
      if (defMethod === 'EMAIL')
        await sendEmailOTP(userData.id, userData.email, userData.name);

      return NextResponse.json({
        requires2FA: true,
        method: defMethod,
        enabledMethods: enabled,
        sessionId: sessId,
        message:
          defMethod === 'TOTP'
            ? 'Enter your authenticator code'
            : 'Code sent to your email',
      });
    }

    // ════════════════════════════════════════════════
    // No 2FA — direct login
    // ════════════════════════════════════════════════
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date().toISOString(),
      })
      .where(eq(users.id, userData.id));

    const token = await createAuthToken(userData.id);
    const redirectPath = getRoleRedirectPath(
      await getPrimaryRoleForRedirect(userData.id),
    );

    await audit(
      {
        action: 'LOGIN',
        entityType: 'user',
        entityId: userData.id,
        newData: { email: userData.email, method: 'PASSWORD_ONLY' },
      },
      request,
      userData.id,
    );

    const resp = NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        roles: roleNames,
        emailVerified: !!userData.emailVerifiedAt,
        isActive: userData.isActive,
      },
      redirectTo: redirectPath,
    });
    resp.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: JWT_EXPIRY_SECONDS,
      path: '/',
    });
    return resp;
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
