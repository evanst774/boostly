// src/lib/db/auth-utils.ts

import { db } from './index';
import { users } from './schema/users';
import { sessions, otpVerifications, twoFASessions } from './schema/auth';
import { eq, and, lt } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import { signJWT, verifyJWT, JWT_COOKIE_NAME } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SystemRoles, type SystemRole } from '@/modules/rbac/roles';
import crypto from 'crypto';

// ============================================
// Constants
// ============================================
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const OTP_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_DAYS = 7;

// ============================================
// Helper function to generate unique session ID
// ============================================
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================
// Password Hashing
// ============================================
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashed: string,
): Promise<boolean> {
  return bcryptjs.compare(password, hashed);
}

// ============================================
// User Management
// ============================================
export async function getUserById(userId: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function getUserByEmail(email: string) {
  return await db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function getUserWithRoles(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      userRoles: {
        with: {
          role: true,
        },
      },
    },
  });

  if (!user) return null;

  const validRoleNames: SystemRole[] = [];

  for (const userRole of user.userRoles) {
    const role = userRole.role;
    if (role) {
      validRoleNames.push(role.name);
    }
  }

  return {
    ...user,
    roles: validRoleNames,
    roleIds: user.userRoles.map((ur) => ur.roleId),
  };
}

// ============================================
// CREATE AUTH TOKEN WITH DATABASE SESSION
// ============================================
export async function createAuthToken(userId: string): Promise<string> {
  const user = await getUserWithRoles(userId);
  if (!user) throw new Error('User not found');

  // ✅ Boostly: Default role is USER if none found
  const primaryRole = user.roles[0] || SystemRoles.USER;

  const token = await signJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: primaryRole,
    roles: user.roles,
  });

  const sessionId = generateSessionId();
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    token: token,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  });

  return token;
}

// ============================================
// Session Management
// ============================================
export async function getSessionByToken(token: string) {
  return await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });
}

export async function revokeSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function revokeAllUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function getUserSessions(userId: string) {
  return await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
  });
}

export async function cleanupExpiredSessions() {
  await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date().toISOString()));
}

// ============================================
// Login Attempt Tracking & Account Lockout
// ============================================
export async function recordFailedLoginAttempt(email: string) {
  const user = await getUserByEmail(email);
  if (!user) return;

  const attempts = (user.failedLoginAttempts || 0) + 1;
  const lockoutUntil =
    attempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        ).toISOString()
      : null;

  await db
    .update(users)
    .set({
      failedLoginAttempts: attempts,
      accountLockedUntil: lockoutUntil,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id));
}

export async function resetLoginAttempts(userId: string) {
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user || !user.accountLockedUntil) return false;
  return new Date(user.accountLockedUntil) > new Date();
}

// ============================================
// Email Verification
// ============================================
export async function generateEmailVerificationToken(
  userId: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');

  await db
    .update(users)
    .set({
      emailVerificationToken: token,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));

  return token;
}

export async function verifyEmail(token: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.emailVerificationToken, token),
  });

  if (!user) return false;

  await db
    .update(users)
    .set({
      emailVerifiedAt: new Date().toISOString(),
      emailVerificationToken: null,
      isActive: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id));

  return true;
}

// ============================================
// Password Reset
// ============================================
export async function generatePasswordResetToken(
  email: string,
): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db
    .update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpires: expiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id));

  return token;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.passwordResetToken, token),
  });

  if (!user) return false;
  if (
    !user.passwordResetExpires ||
    new Date(user.passwordResetExpires) < new Date()
  )
    return false;

  const hashedPassword = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id));

  return true;
}

// ============================================
// OTP Verification (2FA)
// ============================================
export type OtpType =
  | '2FA_LOGIN'
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | '2FA_SETUP';

export async function generateOtp(
  userId: string,
  type: OtpType,
): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db
    .delete(otpVerifications)
    .where(
      and(
        eq(otpVerifications.userId, userId),
        eq(otpVerifications.type, type),
        eq(otpVerifications.used, false),
      ),
    );

  await db.insert(otpVerifications).values({
    userId,
    code,
    type,
    expiresAt: expiresAt.toISOString(),
    used: false,
  });

  return code;
}

export async function verifyOtp(
  userId: string,
  code: string,
  type: OtpType,
): Promise<boolean> {
  const otp = await db.query.otpVerifications.findFirst({
    where: and(
      eq(otpVerifications.userId, userId),
      eq(otpVerifications.code, code),
      eq(otpVerifications.type, type),
      eq(otpVerifications.used, false),
    ),
  });

  if (!otp) return false;
  if (new Date(otp.expiresAt) < new Date()) return false;

  await db
    .update(otpVerifications)
    .set({ used: true, updatedAt: new Date().toISOString() })
    .where(eq(otpVerifications.id, otp.id));

  return true;
}

// ============================================
// Two-Factor Authentication (2FA)
// ============================================

interface Update2FAData {
  twoFAEnabledMethods: ('EMAIL' | 'TOTP')[];
  is2FAEnabled: boolean;
  updatedAt: string;
  totpSecret?: string | null;
  totpBackupCodes?: string[] | null;
}

export async function enable2FA(
  userId: string,
  method: 'EMAIL' | 'TOTP',
  secret?: string,
) {
  const enabledMethods = await get2FAEnabledMethods(userId);

  if (!enabledMethods.includes(method)) {
    enabledMethods.push(method);
  }

  const updateData: Update2FAData = {
    twoFAEnabledMethods: enabledMethods,
    is2FAEnabled: enabledMethods.length > 0,
    updatedAt: new Date().toISOString(),
  };

  if (method === 'TOTP' && secret) {
    updateData.totpSecret = secret;
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex'),
    );
    updateData.totpBackupCodes = backupCodes;
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function disable2FA(userId: string, method: 'EMAIL' | 'TOTP') {
  const enabledMethods = await get2FAEnabledMethods(userId);
  const filtered = enabledMethods.filter((m) => m !== method);

  await db
    .update(users)
    .set({
      twoFAEnabledMethods: filtered,
      is2FAEnabled: filtered.length > 0,
      totpSecret: filtered.includes('TOTP') ? undefined : null,
      totpBackupCodes: filtered.includes('TOTP') ? undefined : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function get2FAEnabledMethods(
  userId: string,
): Promise<('EMAIL' | 'TOTP')[]> {
  const user = await getUserById(userId);
  return user?.twoFAEnabledMethods || [];
}

export async function create2FASession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(twoFASessions).values({
    id: sessionId,
    userId,
    expiresAt: expiresAt.toISOString(),
  });

  return sessionId;
}

export async function verify2FASession(sessionId: string): Promise<boolean> {
  const session = await db.query.twoFASessions.findFirst({
    where: eq(twoFASessions.id, sessionId),
  });

  if (!session) return false;
  if (new Date(session.expiresAt) < new Date()) return false;

  return true;
}

// ============================================
// Cookie Helpers
// ============================================
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
}

// ============================================
// Session Helpers (with DB validation)
// ============================================
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;

  if (!token) return null;

  // Verify JWT
  const payload = await verifyJWT(token);
  if (!payload) return null;

  // Verify session exists in database
  const dbSession = await getSessionByToken(token);
  if (!dbSession || new Date(dbSession.expiresAt) < new Date()) return null;

  const user = await getUserWithRoles(payload.sub);
  if (!user || !user.isActive) return null;

  return {
    user,
    session: dbSession,
    token,
  };
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/login');
  }

  const { user } = session;
  const isAdmin =
    user.roles.includes(SystemRoles.SUPER_ADMIN) ||
    user.roles.includes(SystemRoles.ADMIN);

  if (!isAdmin) {
    redirect('/unauthorized');
  }

  return session;
}

export async function require2FA(userId: string) {
  const methods = await get2FAEnabledMethods(userId);
  if (methods.length > 0) {
    redirect('/2fa');
  }
}

// ============================================
// Logout - Revoke session
// ============================================
export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;

  if (token) {
    // Revoke the session from database
    const session = await getSessionByToken(token);
    if (session) {
      await revokeSession(session.id);
    }
  }

  await clearAuthCookie();
}

// ============================================
// Role Helpers
// ============================================
export async function hasRole(
  userId: string,
  requiredRole: SystemRole,
): Promise<boolean> {
  const user = await getUserWithRoles(userId);
  if (!user) return false;

  if (user.roles.includes(SystemRoles.SUPER_ADMIN)) return true;
  return user.roles.includes(requiredRole);
}

export async function hasAnyRole(
  userId: string,
  requiredRoles: SystemRole[],
): Promise<boolean> {
  const user = await getUserWithRoles(userId);
  if (!user) return false;

  if (user.roles.includes(SystemRoles.SUPER_ADMIN)) return true;
  return requiredRoles.some((role) => user.roles.includes(role));
}

export async function isAdmin(userId: string): Promise<boolean> {
  return hasAnyRole(userId, [SystemRoles.SUPER_ADMIN, SystemRoles.ADMIN]);
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, SystemRoles.SUPER_ADMIN);
}

// ============================================
// Exports
// ============================================
export { JWT_COOKIE_NAME };
