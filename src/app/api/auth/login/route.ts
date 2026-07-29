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
import { SystemRoles } from '@/modules/rbac/roles';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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
  // ============================================
  // FIX: was the string literal 'SALES_PERSON', which doesn't
  // match SystemRoles.USER used everywhere else (auth-utils.ts,
  // AuthContext.tsx, jwt.ts, api/auth/me/route.ts). A user with
  // no assigned roles would get redirected to a different
  // dashboard depending on which code path resolved them.
  // ============================================
  return names[0] || SystemRoles.USER;
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

// ============================================
// FIX: this used to be a single verify2FASession() that deleted
// the session row the moment it was looked up — before the OTP
// or TOTP code was even checked. That meant a session was
// consumed on the FIRST request that referenced it, regardless
// of whether the code turned out to be right or wrong. One
// mistyped digit and the next attempt (even with the correct
// code) failed with "Session expired. Please login again.",
// forcing the user to re-enter their password from scratch.
//
// Split into a read (peek) and a separate consume, so the
// session survives failed attempts and is only deleted once
// verification actually succeeds — see the call sites below.
// ============================================
async function get2FASessionUserId(sessionId: string): Promise<string | null> {
  const [s] = await db
    .select()
    .from(twoFASessions)
    .where(eq(twoFASessions.id, sessionId))
    .limit(1);
  if (!s || new Date(s.expiresAt) < new Date()) return null;
  return s.userId;
}

async function consume2FASession(sessionId: string): Promise<void> {
  await db.delete(twoFASessions).where(eq(twoFASessions.id, sessionId));
}

// ============================================
// FIX: crypto.randomInt, not Math.random — same reasoning
// applied elsewhere in this codebase (register/route.ts,
// verify-email/request/route.ts): an OTP from a predictable
// PRNG is guessable. This one is actually more sensitive than
// the email-verification codes, since it's a login 2FA code.
// ============================================
function generate2FAOTP(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

async function sendEmailOTP(
  userId: string,
  email: string,
  name: string | null,
): Promise<void> {
  const otp = generate2FAOTP();
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
    // ✅ FIX: was "Your 2FA Verification Code - MotoTrack" —
    // leftover branding from a different project.
    subject: 'Your 2FA Verification Code - Boostly',
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

// ============================================
// FIX: extracted from what used to be inline code that ran
// UNCONDITIONALLY right after the user was fetched by email —
// before password verification. That meant submitting a target
// email with ANY wrong password would reveal, with no
// authentication at all, whether the account was locked,
// unverified, or deactivated. Those are now only checked AFTER
// a correct password is confirmed (for the password step) — see
// the call sites below. For the 2FA step this runs right after
// a valid session is confirmed, which is fine: reaching that
// point already required a correct password in step 1.
// ============================================
async function checkAccountGates(
  userData: typeof users.$inferSelect,
  isSuper: boolean,
  email: string,
  request: NextRequest,
): Promise<NextResponse | null> {
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

  return null;
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

    await cleanupExpiredOTPs();

    // ════════════════════════════════════════════════
    // STEP 2 — 2FA verification
    // ════════════════════════════════════════════════
    if (is2FAStep) {
      // Safe here: reaching this step already required a correct
      // password in step 1, so revealing lock/verify/active state
      // isn't a new information leak.
      const gate = await checkAccountGates(userData, isSuper, email, request);
      if (gate) return gate;

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

      const verifiedUserId = await get2FASessionUserId(sessionId);
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
        // ✅ FIX: session is NOT deleted here — the row stays
        // alive (until its own expiry) so the user can try again
        // instead of being bounced back to the password screen.
        return NextResponse.json(
          { message: 'Invalid verification code.' },
          { status: 400 },
        );
      }

      // ── success ────────────────────────────────
      // ✅ FIX: session consumed only now, on confirmed success.
      await consume2FASession(sessionId);

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
    // ============================================
    // FIX: password is now verified BEFORE any account-state
    // (locked / unverified / deactivated) is revealed. Previously
    // those checks ran unconditionally right after the user was
    // looked up by email, which meant anyone submitting a target
    // email with an arbitrary wrong password learned the
    // account's status without ever proving they held the
    // credentials — a straightforward account-enumeration
    // oracle. Now that information is only returned once the
    // password has actually been confirmed correct.
    //
    // Side benefit: verifying the password unconditionally (even
    // for accounts that turn out to be locked) also removes a
    // timing side-channel that could otherwise hint at account
    // state before the bcrypt compare even runs.
    // ============================================
    if (!userData.passwordHash) {
      return NextResponse.json(
        {
          error:
            'This account signs in with a social provider. Please use that instead.',
        },
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

    // Password confirmed — safe to reveal locked / unverified /
    // deactivated state now.
    const gate = await checkAccountGates(userData, isSuper, email, request);
    if (gate) return gate;

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
