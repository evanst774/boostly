// src/hooks/useVideoWatch.ts
import { useCallback } from 'react';

export interface WatchStart {
  startToken: string;
  watchPercent: number;
  alreadyEarnedToday: boolean;
  remainingToday: number;
  dailyLimit: number;
}

export interface WatchResult {
  rewardEarned: number;
  code?: string;
  message?: string;
}

// The start token is kept per video for the browser session, so reopening a
// video and resuming still counts the time already spent watching it.
const tokenKey = (videoId: string) => `boostly:video-token:${videoId}`;

function readToken(videoId: string): string | null {
  try {
    return sessionStorage.getItem(tokenKey(videoId));
  } catch {
    return null;
  }
}

function writeToken(videoId: string, token: string | null) {
  try {
    if (token) sessionStorage.setItem(tokenKey(videoId), token);
    else sessionStorage.removeItem(tokenKey(videoId));
  } catch {
    /* storage unavailable */
  }
}

async function post(videoId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/content/videos/${videoId}/watch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

export function useVideoWatch() {
  /** Call when the player opens. */
  const startWatch = useCallback(async (videoId: string): Promise<WatchStart | null> => {
    const { ok, json } = await post(videoId, { action: 'start' });
    if (!ok) return null;
    if (!readToken(videoId)) writeToken(videoId, json.startToken);
    return json as WatchStart;
  }, []);

  /** Fire-and-forget progress save (5% steps). Never pays. */
  const reportProgress = useCallback(
    (videoId: string, watchPercent: number, watchDuration: number) => {
      post(videoId, { action: 'progress', watchPercent, watchDuration }).catch(() => {});
    },
    [],
  );

  /** Call when the video ends. Returns what was credited and why. */
  const completeWatch = useCallback(
    async (videoId: string, watchDuration: number): Promise<WatchResult> => {
      try {
        const { ok, json } = await post(videoId, {
          action: 'complete',
          startToken: readToken(videoId),
          watchDuration,
        });
        if (!ok) {
          if (json.code === 'RESTART') writeToken(videoId, null);
          return { rewardEarned: 0, code: json.code, message: json.error || 'Could not record this video.' };
        }
        if (json.rewardEarned > 0 || json.code === 'ALREADY_CREDITED') writeToken(videoId, null);
        return json as WatchResult;
      } catch {
        return { rewardEarned: 0, code: 'NETWORK', message: 'Connection problem. Check your internet and try again.' };
      }
    },
    [],
  );

  return { startWatch, reportProgress, completeWatch };
}
