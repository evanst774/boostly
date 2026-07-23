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

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const provider = parseProviderParam(params.provider);
    if (!provider) {
      return fail(request, 'unknown_provider');
    }

    const { searchParams } = new URL(request.url);

    // User declined consent, or the provider errored
    if (searchParams.get('error')) {
      console.error('[OAUTH] Provider error:', searchParams.get('error'));
      return fail(request, 'provider_error');
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    const codeVerifier =
      request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value ?? null;

    if (!code || !state || !storedState || !safeEquals(state, storedState)) {
      console.error('[OAUTH] Invalid state or missing code');
      return fail(request, 'invalid_state');
    }

    // Exchange code for profile
    let profile: OAuthProfile;
    let accessToken: string;

    try {
      const result = await exchangeCodeForProfile(provider, code, codeVerifier);
      profile = result.profile;
      accessToken = result.accessToken;
    } catch (error) {
      console.error('[OAUTH] Failed to exchange code:', error);
      return fail(request, 'token_exchange_failed');
    }

    // Resolve user
    const resolution = await resolveUser(provider, profile);

    if (resolution.outcome === 'NEEDS_PASSWORD_LOGIN') {
      return fail(request, 'link_requires_login');
    }
    if (resolution.outcome === 'NO_EMAIL') {
      return fail(request, 'no_email_from_provider');
    }

    const { userId, isNewUser, wasLinked } = resolution;

    // Handle referral
    const referralCode = request.cookies.get(OAUTH_REFERRAL_COOKIE)?.value;
    if (isNewUser && referralCode) {
      try {
        await referralsService.attachPendingReferral(userId, referralCode);
      } catch (error) {
        console.error('[OAUTH] Failed to attach referral:', error);
        // Non-fatal - continue
      }
    }

    // Update OAuth account
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

    // Audit log
    await db.insert(auditLogs).values({
      userId,
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

    // Check for 2FA
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

    // Create session
    const returnTo = request.cookies.get(OAUTH_RETURN_COOKIE)?.value;
    const destination =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : '/dashboard';

    const response = NextResponse.redirect(new URL(destination, request.url));

    // Create auth token
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
    console.error('[OAUTH] Callback failed:', error);
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

async function resolveUser(
  provider: OAuthProvider,
  profile: OAuthProfile,
): Promise<Resolution> {
  // Check if OAuth account already linked
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

  // No email from provider
  if (!profile.email) {
    return { outcome: 'NO_EMAIL' };
  }

  // Check if user exists with this email
  const existing = await db.query.users.findFirst({
    where: eq(users.email, profile.email),
  });

  if (existing) {
    // ============================================
    // FIX: this used to require BOTH the OAuth
    // provider's email AND the existing local account's
    // email to already be verified:
    //
    //   const bothSidesVerified =
    //     profile.emailVerified && existing.emailVerifiedAt !== null;
    //
    // That's stricter than it needs to be, and not how
    // "Continue with Google" is supposed to behave. The
    // whole point of the provider handshake is that Google
    // is vouching for the email on the user's behalf — a
    // verified Google account IS sufficient proof of
    // ownership on its own. Requiring the *local* account to
    // independently already be verified meant anyone who
    // registered by password and hadn't yet clicked their
    // verification email (a completely normal, common state)
    // would be permanently unable to use "Continue with
    // Google" on that same address, even though Google had
    // just proven who they are.
    //
    // The actual security property worth keeping is
    // narrower: don't silently attach a login to an existing
    // account unless the OAuth provider itself confirms the
    // email. That's `profile.emailVerified` alone — the local
    // account's prior verification state doesn't need to gate
    // this decision.
    // ============================================
    if (!profile.emailVerified) {
      return { outcome: 'NEEDS_PASSWORD_LOGIN' };
    }

    // Link OAuth account to existing user
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

    // ============================================
    // FIX: backfill emailVerifiedAt AND isActive if either
    // isn't already set. Google just vouched for this email,
    // so the account should come out of this link in the same
    // state a brand-new OAuth signup gets (see
    // createOAuthUser below — isActive: true immediately,
    // emailVerifiedAt set immediately) rather than being left
    // half-activated.
    //
    // isActive specifically matters here because
    // users.isActive defaults to `false` in the schema
    // (src/lib/db/schema/users.ts). Without this backfill, a
    // user who registered by password but never verified
    // would link successfully, get handed a valid session
    // cookie, and start redirecting toward /dashboard — then
    // get immediately bounced to /account-locked the moment
    // /api/auth/me ran, because isActive was still false.
    // Same underlying bug, one step later in the flow.
    // ============================================
    const needsBackfill = !existing.emailVerifiedAt || !existing.isActive;
    if (needsBackfill) {
      await db
        .update(users)
        .set({
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date().toISOString(),
          isActive: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, existing.id));
    }

    return {
      outcome: 'OK',
      userId: existing.id,
      isNewUser: false,
      wasLinked: true,
    };
  }

  // Create new user
  const userId = await createOAuthUser(provider, profile);
  return { outcome: 'OK', userId, isNewUser: true, wasLinked: false };
}

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
        passwordHash: null,
        avatar: profile.avatar,
        isActive: true,
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

function generateReferralCode(userId: string): string {
  const prefix = userId.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${random}`;
}

function fail(request: NextRequest, reason: string): NextResponse {
  const errorMessages: Record<string, string> = {
    unknown_provider: 'Unknown authentication provider',
    provider_error: 'Authentication provider returned an error',
    invalid_state: 'Invalid authentication state',
    token_exchange_failed: 'Failed to exchange authentication code',
    link_requires_login:
      'Please log in with your password first to link this account',
    no_email_from_provider: 'No email provided by the authentication service',
    oauth_failed: 'Authentication failed. Please try again.',
    cancelled: 'You cancelled the authentication process',
  };

  const message = errorMessages[reason] || 'Authentication failed';
  const response = NextResponse.redirect(
    new URL(
      `/login?error=${reason}&message=${encodeURIComponent(message)}`,
      request.url,
    ),
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
