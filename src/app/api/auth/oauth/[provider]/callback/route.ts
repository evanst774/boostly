// src/app/api/auth/oauth/[provider]/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { wallets } from '@/lib/db/schema/wallet';
import { roles, userRoles } from '@/lib/db/schema/rbac';
import { auditLogs } from '@/lib/db/schema/audit';
import { referralCodes } from '@/lib/db/schema/referrals';
import { oauthAccounts, type OAuthProvider } from '@/lib/db/schema/oauth';
import {
  OAUTH_REFERRAL_COOKIE,
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  exchangeCodeForProfile,
  parseProviderParam,
  safeEquals,
  type OAuthProfile,
} from '@/lib/auth/oauth';
import {
  create2FASession,
  createAuthToken,
  getUserById,
} from '@/lib/db/auth-utils';
import { JWT_COOKIE_NAME } from '@/lib/jwt';
import { referralsService } from '@/modules/referrals/service';

export const dynamic = 'force-dynamic';

/** Matches SESSION_EXPIRY_DAYS in auth-utils.ts. Keep the two in step. */
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = parseProviderParam(params.provider);
  if (!provider) return fail(request, 'unknown_provider');

  const { searchParams } = new URL(request.url);

  // User declined consent, or the provider errored.
  if (searchParams.get('error')) return fail(request, 'cancelled');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier =
    request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value ?? null;

  if (!code || !state || !storedState || !safeEquals(state, storedState)) {
    // CSRF guard. A mismatch means this callback wasn't started by this browser.
    return fail(request, 'invalid_state');
  }

  try {
    const { profile, accessToken } = await exchangeCodeForProfile(
      provider,
      code,
      codeVerifier,
    );

    const resolution = await resolveUser(provider, profile);

    if (resolution.outcome === 'NEEDS_PASSWORD_LOGIN') {
      return fail(request, 'link_requires_login');
    }
    if (resolution.outcome === 'NO_EMAIL') {
      return fail(request, 'no_email_from_provider');
    }

    const { userId, isNewUser, wasLinked } = resolution;

    // Referral is RECORDED only. Commission is paid by
    // referralsService.recordPurchaseCommission when they buy something.
    const referralCode = request.cookies.get(OAUTH_REFERRAL_COOKIE)?.value;
    if (isNewUser && referralCode) {
      await referralsService.attachPendingReferral(userId, referralCode);
    }

    await db
      .update(oauthAccounts)
      .set({
        accessToken,
        lastUsedAt: new Date().toISOString(),
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerAccountId, profile.providerAccountId),
        ),
      );

    await db.insert(auditLogs).values({
      userId,
      // These three must be added to `auditActions` in schema/audit.ts.
      action: isNewUser
        ? 'OAUTH_ACCOUNT_CREATED'
        : wasLinked
          ? 'OAUTH_ACCOUNT_LINKED'
          : 'OAUTH_LOGIN',
      entityType: 'user',
      entityId: userId,
      newData: JSON.stringify({ provider, email: profile.email }),
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    /**
     * 2FA gate.
     *
     * OAuth proves ONE factor — that this person controls the Google account.
     * A user who deliberately turned on 2FA must still clear the second one, or
     * social sign-in becomes a way to bypass the protection they asked for.
     *
     * NOTE: the cookie name and shape below must match whatever your existing
     * login route hands to /2fa. Adjust if yours differs.
     */
    const user = await getUserById(userId);
    if (user?.is2FAEnabled) {
      const twoFASessionId = await create2FASession(userId);
      const response = NextResponse.redirect(new URL('/2fa', request.url));

      response.cookies.set('boostly_2fa_session', twoFASessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });

      clearOAuthCookies(response);
      return response;
    }

    // --- Full session ---
    const returnTo = request.cookies.get(OAUTH_RETURN_COOKIE)?.value;
    const destination =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : '/dashboard';

    const response = NextResponse.redirect(new URL(destination, request.url));

    /**
     * createAuthToken signs the JWT AND inserts the sessions row, so this stays
     * consistent with password login — including the DB liveness check that
     * getSession() performs on every request.
     *
     * The cookie is set on the response rather than via setAuthCookie(), which
     * uses next/headers cookies() and won't attach to a redirect we construct.
     */
    const token = await createAuthToken(userId);
    response.cookies.set(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    await db
      .update(users)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(users.id, userId));

    clearOAuthCookies(response);
    return response;
  } catch (error) {
    console.error('[OAUTH] callback failed:', error);
    return fail(request, 'oauth_failed');
  }
}

// ============================================
// USER RESOLUTION
// ============================================

type Resolution =
  | { outcome: 'OK'; userId: string; isNewUser: boolean; wasLinked: boolean }
  | { outcome: 'NEEDS_PASSWORD_LOGIN' }
  | { outcome: 'NO_EMAIL' };

/**
 * Decides which Boostly user this external identity belongs to.
 *
 * The linking rules are the security-critical part of any OAuth integration:
 *
 *  1. Known provider account -> that user. The provider's stable id is the
 *     identity, not the email (people change emails).
 *
 *  2. Unknown provider account, email matches an existing user:
 *       - link ONLY if the provider verified the email AND the local account
 *         has verified its own.
 *       - otherwise refuse and require a password login first. Anyone can
 *         create a Facebook account claiming any address; auto-linking on an
 *         unverified email hands them the victim's wallet.
 *
 *  3. No match -> create a new user.
 */
async function resolveUser(
  provider: OAuthProvider,
  profile: OAuthProfile,
): Promise<Resolution> {
  const linked = await db.query.oauthAccounts.findFirst({
    where: and(
      eq(oauthAccounts.provider, provider),
      eq(oauthAccounts.providerAccountId, profile.providerAccountId),
    ),
  });

  if (linked) {
    return {
      outcome: 'OK',
      userId: linked.userId,
      isNewUser: false,
      wasLinked: false,
    };
  }

  // Facebook frequently omits email entirely.
  if (!profile.email) return { outcome: 'NO_EMAIL' };

  const existing = await db.query.users.findFirst({
    where: eq(users.email, profile.email),
  });

  if (existing) {
    const bothSidesVerified =
      profile.emailVerified && existing.emailVerifiedAt !== null;

    if (!bothSidesVerified) return { outcome: 'NEEDS_PASSWORD_LOGIN' };

    await db.insert(oauthAccounts).values({
      userId: existing.id,
      provider,
      providerAccountId: profile.providerAccountId,
      providerEmail: profile.email,
      providerEmailVerified: profile.emailVerified,
      providerName: profile.name,
      providerAvatar: profile.avatar,
      lastUsedAt: new Date().toISOString(),
    });

    return {
      outcome: 'OK',
      userId: existing.id,
      isNewUser: false,
      wasLinked: true,
    };
  }

  const userId = await createOAuthUser(provider, profile);
  return { outcome: 'OK', userId, isNewUser: true, wasLinked: false };
}

/**
 * Creates user, oauth link, role, wallet and referral code atomically.
 * A partial signup — user with no wallet — would break every later reward
 * credit for that account, permanently.
 */
async function createOAuthUser(
  provider: OAuthProvider,
  profile: OAuthProfile,
): Promise<string> {
  const now = new Date().toISOString();
  const email = profile.email!;

  return await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        name: profile.name ?? email.split('@')[0],
        email,
        // Requires users.passwordHash to be nullable.
        passwordHash: null,
        avatar: profile.avatar,
        isActive: true,
        // A provider-verified email counts as verified — skipping the OTP is
        // most of the point of social sign-in.
        emailVerifiedAt: profile.emailVerified ? now : null,
        lastLoginAt: now,
        failedLoginAttempts: 0,
        is2FAEnabled: false,
        twoFAEnabledMethods: [],
      })
      .returning();

    await tx.insert(oauthAccounts).values({
      userId: newUser.id,
      provider,
      providerAccountId: profile.providerAccountId,
      providerEmail: email,
      providerEmailVerified: profile.emailVerified,
      providerName: profile.name,
      providerAvatar: profile.avatar,
      lastUsedAt: now,
    });

    const userRole = await tx.query.roles.findFirst({
      where: eq(roles.name, 'USER'),
    });
    if (userRole) {
      await tx.insert(userRoles).values({
        userId: newUser.id,
        roleId: userRole.id,
        assignedBy: newUser.id,
      });
    }

    await tx.insert(wallets).values({ userId: newUser.id });

    await tx.insert(referralCodes).values({
      userId: newUser.id,
      code: generateReferralCode(newUser.id),
      isActive: true,
      timesUsed: 0,
    });

    return newUser.id;
  });
}

// ============================================
// HELPERS
// ============================================

function generateReferralCode(userId: string): string {
  const prefix = userId.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${random}`;
}

function fail(request: NextRequest, reason: string): NextResponse {
  const response = NextResponse.redirect(
    new URL(`/login?error=${reason}`, request.url),
  );
  clearOAuthCookies(response);
  return response;
}

function clearOAuthCookies(response: NextResponse): void {
  for (const name of [
    OAUTH_STATE_COOKIE,
    OAUTH_VERIFIER_COOKIE,
    OAUTH_RETURN_COOKIE,
    OAUTH_REFERRAL_COOKIE,
  ]) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
}
