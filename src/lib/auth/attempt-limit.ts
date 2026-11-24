// src/lib/auth/attempt-limit.ts
// Caps wrong verification codes per user and purpose (in memory, per server
// instance): 5 wrong tries in 15 minutes locks that check for the window.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map<string, { n: number; since: number }>();

export function isLocked(key: string): boolean {
  const f = fails.get(key);
  if (!f) return false;
  if (Date.now() - f.since > WINDOW_MS) {
    fails.delete(key);
    return false;
  }
  return f.n >= MAX_FAILS;
}

export function recordFailure(key: string) {
  const now = Date.now();
  const f = fails.get(key);
  if (!f || now - f.since > WINDOW_MS) fails.set(key, { n: 1, since: now });
  else f.n += 1;
  if (fails.size > 10_000) fails.clear();
}

export function clearFailures(key: string) {
  fails.delete(key);
}

export const TOO_MANY = 'Too many wrong codes. Please wait 15 minutes and try again.';
