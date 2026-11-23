// src/lib/auth/two-factor.ts
//
// Starting a 2FA login challenge, shared by password login and "Continue
// with Google" so both behave the same: pick the method, open a 2FA session,
// and email the code when the method is EMAIL.
import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { otpVerifications } from '@/lib/db/schema';
import { create2FASession } from '@/lib/db/auth-utils';
import { parseEnabledMethods } from '@/lib/utils';

export type TwoFactorMethod = 'EMAIL' | 'TOTP';

export function resolveEnabledMethods(data: {
  twoFAEnabledMethods?: unknown;
  twoFAMethod?: string | null;
  is2FAEnabled?: boolean | null;
}): TwoFactorMethod[] {
  const parsed = parseEnabledMethods(data.twoFAEnabledMethods);
  if (parsed.length > 0) return parsed;
  if (data.is2FAEnabled && data.twoFAMethod) {
    const m = data.twoFAMethod as TwoFactorMethod;
    if (m === 'EMAIL' || m === 'TOTP') return [m];
  }
  return [];
}

/** Emails a fresh 6-digit login code (replacing any unused one). */
export async function sendEmailLoginCode(userId: string, email: string, name: string | null) {
  const otp = crypto.randomInt(100_000, 1_000_000).toString();
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
    subject: 'Your 2FA Verification Code - Boostly',
    html: build2FAOTPEmailHTML(name || 'User', otp),
    type: 'VERIFICATION',
  });
}

/**
 * Opens a 2FA challenge for a user who passed the first factor.
 * Returns null when 2FA is on but no method is configured.
 */
export async function startTwoFactorChallenge(user: {
  id: string;
  email: string;
  name: string | null;
  twoFADefaultMethod?: string | null;
  twoFAEnabledMethods?: unknown;
  twoFAMethod?: string | null;
  is2FAEnabled?: boolean | null;
}) {
  const enabledMethods = resolveEnabledMethods(user);
  if (enabledMethods.length === 0) return null;
  const method = ((user.twoFADefaultMethod as TwoFactorMethod) ?? enabledMethods[0]) as TwoFactorMethod;
  const sessionId = await create2FASession(user.id);
  if (method === 'EMAIL') await sendEmailLoginCode(user.id, user.email, user.name);
  return { sessionId, method, enabledMethods };
}

/** Link to the 2FA step page, in the shape the /2fa page expects. */
export function twoFactorPageUrl(email: string, challenge: { sessionId: string; method: TwoFactorMethod; enabledMethods: TwoFactorMethod[] }) {
  const params = new URLSearchParams({
    email,
    sessionId: challenge.sessionId,
    method: challenge.method,
    methods: JSON.stringify(challenge.enabledMethods),
  });
  return `/2fa?${params.toString()}`;
}
