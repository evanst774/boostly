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
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const provider = parseProviderParam(params.provider);
    if (!provider) {
      console.error(`[OAUTH] Unknown provider: ${params.provider}`);
      return NextResponse.redirect(
        new URL('/login?error=unknown_provider', request.url),
      );
    }

    let config;
    try {
      config = getProviderConfig(provider);
    } catch (error) {
      console.error(`[OAUTH] ${provider} is not configured:`, error);
      return NextResponse.redirect(
        new URL('/login?error=provider_unavailable', request.url),
      );
    }

    const state = randomToken();
    const codeVerifier = config.usePkce ? randomToken(48) : null;

    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('ref')?.toUpperCase().trim();
    const returnTo = searchParams.get('returnTo');

    // Build the authorization URL
    const authUrl = buildAuthorizeUrl(provider, state, codeVerifier);
    const response = NextResponse.redirect(authUrl);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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

    // Only relative paths - prevent open redirect
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      response.cookies.set(OAUTH_RETURN_COOKIE, returnTo, cookieOptions);
    }

    return response;
  } catch (error) {
    console.error('[OAUTH] Error initiating OAuth flow:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_init_failed', request.url),
    );
  }
}
