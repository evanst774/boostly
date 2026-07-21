// src/hooks/useGameSession.ts
import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// TYPES - mirror the service's return shapes
// ============================================

export interface GameSession {
  sessionId: string;
  embedUrl: string;
  embedOrigin: string;
  heartbeatIntervalSeconds: number;
  minPlaySeconds: number;
  remainingDailySeconds: number;
  maxSessionReward: number;
}

export interface HeartbeatState {
  verifiedSeconds: number;
  qualified: boolean;
  projectedReward: number;
  remainingDailySeconds: number;
  flagged: boolean;
}

export type CompletionResult =
  | {
      status: 'REWARDED';
      rewardEarned: number;
      verifiedSeconds: number;
      newBalance: number;
    }
  | {
      status: 'NO_REWARD';
      rewardEarned: 0;
      verifiedSeconds: number;
      reason: 'TOO_SHORT' | 'FLAGGED' | 'CAP_REACHED' | 'ALREADY_CLAIMED';
      minPlaySeconds: number;
    };

interface UseGameSessionReturn {
  session: GameSession | null;
  progress: HeartbeatState | null;
  isStarting: boolean;
  isCompleting: boolean;
  error: string | null;
  start: (gameId: string) => Promise<GameSession | null>;
  complete: (report?: { score?: number }) => Promise<CompletionResult | null>;
  reset: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Owns the play-session lifecycle: start, heartbeat while visible, complete.
 *
 * Heartbeats pause when the tab is hidden. Without that, a user could open a
 * game, switch apps, and farm rewards from a backgrounded tab — which is the
 * single most common way time-based reward systems get drained.
 */
export function useGameSession(): UseGameSessionReturn {
  const [session, setSession] = useState<GameSession | null>(null);
  const [progress, setProgress] = useState<HeartbeatState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const completedRef = useRef(false);

  const stopHeartbeat = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || completedRef.current) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    try {
      const response = await fetch(
        `/api/content/games/sessions/${sessionId}/heartbeat`,
        { method: 'POST' },
      );
      if (!response.ok) return;

      const result: {
        ok: boolean;
        verifiedSeconds: number;
        qualified: boolean;
        projectedReward: number;
        remainingDailySeconds: number;
        reason?: string;
      } = await response.json();

      setProgress({
        verifiedSeconds: result.verifiedSeconds,
        qualified: result.qualified,
        projectedReward: result.projectedReward,
        remainingDailySeconds: result.remainingDailySeconds,
        flagged: result.reason === 'FLAGGED',
      });

      // Server closed or flagged the session — stop burning requests.
      if (!result.ok) stopHeartbeat();
    } catch {
      // Transient network failure. The next beat re-syncs from the server's
      // own clock, so a dropped beat costs the user at most one interval.
    }
  }, [stopHeartbeat]);

  const start = useCallback(
    async (gameId: string): Promise<GameSession | null> => {
      setIsStarting(true);
      setError(null);
      completedRef.current = false;

      try {
        const response = await fetch(`/api/content/games/${gameId}/session`, {
          method: 'POST',
        });

        if (!response.ok) {
          const body: { error?: string } = await response.json();
          setError(body.error ?? 'Could not start this game');
          return null;
        }

        const data: GameSession = await response.json();
        sessionIdRef.current = data.sessionId;
        setSession(data);
        setProgress({
          verifiedSeconds: 0,
          qualified: false,
          projectedReward: 0,
          remainingDailySeconds: data.remainingDailySeconds,
          flagged: false,
        });

        stopHeartbeat();
        timerRef.current = setInterval(
          sendHeartbeat,
          data.heartbeatIntervalSeconds * 1000,
        );

        return data;
      } catch {
        setError('Network error. Check your connection and try again.');
        return null;
      } finally {
        setIsStarting(false);
      }
    },
    [sendHeartbeat, stopHeartbeat],
  );

  const complete = useCallback(
    async (
      report: { score?: number } = {},
    ): Promise<CompletionResult | null> => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || completedRef.current) return null;

      completedRef.current = true;
      stopHeartbeat();
      setIsCompleting(true);

      try {
        const response = await fetch(
          `/api/content/games/sessions/${sessionId}/complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: report.score ?? 0 }),
          },
        );

        if (!response.ok) {
          const body: { error?: string } = await response.json();
          setError(body.error ?? 'Could not save your session');
          return null;
        }

        return (await response.json()) as CompletionResult;
      } catch {
        setError('Network error while saving your reward.');
        return null;
      } finally {
        setIsCompleting(false);
      }
    },
    [stopHeartbeat],
  );

  const reset = useCallback(() => {
    stopHeartbeat();
    sessionIdRef.current = null;
    completedRef.current = false;
    setSession(null);
    setProgress(null);
    setError(null);
  }, [stopHeartbeat]);

  // Pause on tab hide, and beat immediately on return so the user isn't
  // penalised a full interval for switching away briefly.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden && sessionIdRef.current && !completedRef.current) {
        void sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [sendHeartbeat]);

  useEffect(() => stopHeartbeat, [stopHeartbeat]);

  return {
    session,
    progress,
    isStarting,
    isCompleting,
    error,
    start,
    complete,
    reset,
  };
}
