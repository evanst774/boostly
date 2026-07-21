// src/app/api/auth/oauth/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import {
  OAUTH_COOKIE_MAX_AGE_SECONDS,
  OAUTH_REFERRAL_COOKIE,
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  buildAuthorizeUrl,
  getProviderConfig,
  parseProviderParam,
  randomToken,
} from '@/lib/auth/oauth';

export const dynamic = 'force-dynamic';

/**
 * Kicks off the OAuth flow.
 *
 * GET /api/auth/oauth/google?ref=ABCD1234&returnTo=/dashboard
 *
 * The referral code rides in a cookie rather than the state param — state must
 * stay an opaque random value we can compare, and stuffing data into it invites
 * someone to tamper with the parts they can read.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = parseProviderParam(params.provider);
  if (!provider) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }

  let config;
  try {
    config = getProviderConfig(provider);
  } catch {
    // Missing env vars. Fail loudly in logs, vaguely to the user.
    console.error(`[OAUTH] ${provider} is not configured`);
    return NextResponse.redirect(
      new URL('/login?error=provider_unavailable', request.url),
    );
  }

  const state = randomToken();
  const codeVerifier = config.usePkce ? randomToken(48) : null;

  const { searchParams } = new URL(request.url);
  const referralCode = searchParams.get('ref')?.toUpperCase().trim();
  const returnTo = searchParams.get('returnTo');

  const response = NextResponse.redirect(
    buildAuthorizeUrl(provider, state, codeVerifier),
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Must be 'lax', not 'strict': the provider redirects the user back
    // cross-site, and 'strict' would withhold the cookie on that navigation,
    // breaking every callback.
    sameSite: 'lax' as const,
    path: '/',
    maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
  };

  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);

  if (codeVerifier) {
    response.cookies.set(OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  }

  if (referralCode) {
    response.cookies.set(OAUTH_REFERRAL_COOKIE, referralCode, cookieOptions);
  }

  // Only relative paths — an absolute URL here is an open redirect.
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    response.cookies.set(OAUTH_RETURN_COOKIE, returnTo, cookieOptions);
  }

  return response;
}
