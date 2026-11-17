// src/lib/games/embed-policy.ts
//
// When can a third-party game run in our iframe with its own storage?
//
// `sandbox="allow-scripts allow-same-origin"` is only dangerous when the
// framed page shares OUR origin: it could then reach into the parent page,
// read our cookies/storage and remove its own sandbox. A game on a different
// origin with allow-same-origin just gets ITS OWN origin's storage (which many
// HTML5 games need for saves/settings) and still can't touch Boostly.
// So: grant it only for HTTPS games on a different origin than the app.
//
// Games are served from a sibling subdomain (games.boostly.buzz). That is safe
// ONLY while our auth cookies stay host-only + httpOnly (no `domain:` option
// on any cookies.set call). Never scope a session cookie to the parent domain
// (e.g. `.boostly.buzz`): every framed game would then receive it.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Parsed origin of a game URL, or null when it's unusable. */
export function parseGameOrigin(gameUrl: string | null | undefined): URL | null {
  if (!gameUrl) return null;
  try {
    return new URL(gameUrl);
  } catch {
    return null;
  }
}

/**
 * Why a game URL can't be embedded, or null when it's acceptable.
 * `appOrigins` are the origins Boostly itself is served from.
 */
export function gameUrlProblem(
  gameUrl: string | null | undefined,
  appOrigins: string[],
  { allowInsecureLocal = false } = {},
): string | null {
  const url = parseGameOrigin(gameUrl);
  if (!url) return 'Game URL is missing or invalid';
  const localDev = allowInsecureLocal && LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== 'https:' && !localDev) {
    return 'Game URL must use https://';
  }
  if (appOrigins.some((o) => o && o === url.origin)) {
    return 'Games must be hosted on a different domain than Boostly';
  }
  return null;
}

/** Whether the iframe may be granted allow-same-origin (client side). */
export function canGrantGameStorage(
  embedOrigin: string | null | undefined,
  pageOrigin: string,
): boolean {
  if (!embedOrigin) return false;
  try {
    const game = new URL(embedOrigin);
    return game.protocol === 'https:' && game.origin !== pageOrigin;
  } catch {
    return false;
  }
}

/** Sandbox tokens for the game iframe. */
export function gameSandbox(grantStorage: boolean): string {
  return [
    'allow-scripts',
    'allow-pointer-lock',
    'allow-forms',
    'allow-popups',
    'allow-popups-to-escape-sandbox',
    ...(grantStorage ? ['allow-same-origin'] : []),
  ].join(' ');
}

/** Origins Boostly is served from, for server-side checks. */
export function appOriginsFromEnv(): string[] {
  const out: string[] = [];
  for (const raw of [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL]) {
    const url = parseGameOrigin(raw);
    if (url) out.push(url.origin);
  }
  return out;
}
