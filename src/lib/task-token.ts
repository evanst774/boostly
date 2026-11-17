// src/lib/task-token.ts
//
// Stateless proof of "when did this user start this task". The server issues
// a token when a task starts (video opened, survey questions loaded) and
// requires it back on completion, so the elapsed time is measured by the
// server's clock rather than trusted from the client.
import { createHmac, timingSafeEqual } from 'crypto';

export type TaskKind = 'video' | 'survey';

interface TaskTokenPayload {
  u: string; // userId
  k: TaskKind;
  i: string; // content id
  t: number; // issued at (ms)
}

/** Tokens older than this are rejected; the user just starts again. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET environment variable is not set');
  return s;
}

function sign(data: string): string {
  return createHmac('sha256', `task-token:${secret()}`)
    .update(data)
    .digest('base64url');
}

export function issueTaskToken(
  userId: string,
  kind: TaskKind,
  contentId: string,
  now: number = Date.now(),
): string {
  const payload: TaskTokenPayload = { u: userId, k: kind, i: contentId, t: now };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data)}`;
}

/**
 * Returns the ms elapsed since the token was issued, or null when the token is
 * missing, forged, expired, or for another user/task.
 */
export function elapsedSinceTaskStart(
  token: string | null | undefined,
  userId: string,
  kind: TaskKind,
  contentId: string,
  now: number = Date.now(),
): number | null {
  if (!token || typeof token !== 'string') return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  let payload: TaskTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (payload.u !== userId || payload.k !== kind || payload.i !== contentId) {
    return null;
  }
  const elapsed = now - payload.t;
  if (elapsed < 0 || elapsed > MAX_AGE_MS) return null;
  return elapsed;
}
