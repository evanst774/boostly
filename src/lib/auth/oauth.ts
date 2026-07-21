// src/lib/auth/oauth.ts
import crypto from 'crypto';

import { OAuthProviderEnum, type OAuthProvider } from '@/lib/db/schema/oauth';

// ============================================
// TYPES
// ============================================

export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatar: string | null;
}

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  /** Google supports PKCE; Facebook's implementation is inconsistent. */
  usePkce: boolean;
  extraAuthParams?: Record<string, string>;
  parseProfile: (raw: unknown) => OAuthProfile;
}

// ============================================
// CONSTANTS
// ============================================

export const OAUTH_STATE_COOKIE = 'boostly_oauth_state';
export const OAUTH_VERIFIER_COOKIE = 'boostly_oauth_verifier';
export const OAUTH_RETURN_COOKIE = 'boostly_oauth_return';
export const OAUTH_REFERRAL_COOKIE = 'boostly_oauth_ref';

/** Short — the round trip to the provider takes seconds, not minutes. */
export const OAUTH_COOKIE_MAX_AGE_SECONDS = 600;

function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error('NEXT_PUBLIC_APP_URL is not set');
  return url.replace(/\/$/, '');
}

export function redirectUri(provider: OAuthProvider): string {
  return `${appUrl()}/api/auth/oauth/${provider.toLowerCase()}/callback`;
}

// ============================================
// PROFILE PARSERS
// ============================================

function parseGoogleProfile(raw: unknown): OAuthProfile {
  const p = raw as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!p.sub) throw new Error('Google did not return a user id');

  return {
    providerAccountId: p.sub,
    email: p.email?.toLowerCase() ?? null,
    // Google reliably reports this. Trust it, but don't assume it's true.
    emailVerified: p.email_verified === true,
    name: p.name ?? null,
    avatar: p.picture ?? null,
  };
}

function parseFacebookProfile(raw: unknown): OAuthProfile {
  const p = raw as {
    id?: string;
    email?: string;
    name?: string;
    picture?: { data?: { url?: string } };
  };

  if (!p.id) throw new Error('Facebook did not return a user id');

  return {
    providerAccountId: p.id,
    /**
     * Facebook often returns NO email — users can register with a phone
     * number, and the email permission is declinable. Callers must handle null.
     */
    email: p.email?.toLowerCase() ?? null,
    /**
     * Facebook does not tell us whether the address is verified. Treating it as
     * unverified is the only safe default: an unverified provider email must
     * never auto-link to an existing Boostly account.
     */
    emailVerified: false,
    name: p.name ?? null,
    avatar: p.picture?.data?.url ?? null,
  };
}

// ============================================
// PROVIDER REGISTRY
// ============================================

export function getProviderConfig(provider: OAuthProvider): ProviderConfig {
  switch (provider) {
    case OAuthProviderEnum.GOOGLE:
      return {
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        scope: 'openid email profile',
        clientId: requireEnv('GOOGLE_CLIENT_ID'),
        clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
        usePkce: true,
        extraAuthParams: {
          access_type: 'online',
          prompt: 'select_account',
        },
        parseProfile: parseGoogleProfile,
      };

    case OAuthProviderEnum.FACEBOOK:
      return {
        authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
        userInfoUrl:
          'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)',
        scope: 'email public_profile',
        clientId: requireEnv('FACEBOOK_APP_ID'),
        clientSecret: requireEnv('FACEBOOK_APP_SECRET'),
        usePkce: false,
        parseProfile: parseFacebookProfile,
      };
  }
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
}

export function parseProviderParam(raw: string): OAuthProvider | null {
  const upper = raw.toUpperCase();
  return upper === 'GOOGLE' || upper === 'FACEBOOK' ? upper : null;
}

// ============================================
// PKCE + STATE
// ============================================

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function pkceChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Constant-time comparison for the state check. A plain `===` on a secret leaks
 * timing information; cheap to avoid.
 */
export function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ============================================
// AUTHORIZE URL
// ============================================

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  state: string,
  codeVerifier: string | null,
): string {
  const config = getProviderConfig(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri(provider),
    response_type: 'code',
    scope: config.scope,
    state,
    ...config.extraAuthParams,
  });

  if (config.usePkce && codeVerifier) {
    params.set('code_challenge', pkceChallenge(codeVerifier));
    params.set('code_challenge_method', 'S256');
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

// ============================================
// TOKEN EXCHANGE + PROFILE FETCH
// ============================================

export async function exchangeCodeForProfile(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string | null,
): Promise<{ profile: OAuthProfile; accessToken: string }> {
  const config = getProviderConfig(provider);

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri(provider),
  });

  if (config.usePkce && codeVerifier) {
    body.set('code_verifier', codeVerifier);
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!tokenResponse.ok) {
    // Never surface the provider's raw body — it can echo the client secret.
    throw new Error(`Token exchange failed (${tokenResponse.status})`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error('Provider returned no access token');
  }

  const userResponse = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json',
    },
  });

  if (!userResponse.ok) {
    throw new Error(`Profile fetch failed (${userResponse.status})`);
  }

  const raw: unknown = await userResponse.json();

  return {
    profile: config.parseProfile(raw),
    accessToken: tokenData.access_token,
  };
}
