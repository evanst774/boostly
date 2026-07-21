// src/hooks/useVideoWatch.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WatchProgress {
  videoId: string;
  watchPercent: number;
  watchDuration: number;
  completed: boolean;
  rewardEarned?: number;
}

export function useVideoWatch() {
  const [isWatching, setIsWatching] = useState(false);
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const { user } = useAuth();

  const trackWatch = useCallback(
    async (videoId: string, watchPercent: number, watchDuration: number) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsWatching(true);

      try {
        const response = await fetch(`/api/content/videos/${videoId}/watch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            watchPercent,
            watchDuration,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to track watch progress');
        }

        const result = await response.json();
        setProgress({
          videoId,
          watchPercent,
          watchDuration,
          completed: result.watch?.completed || watchPercent >= 80,
          rewardEarned: result.rewardEarned || 0,
        });

        return result;
      } catch (error) {
        console.error('Error tracking watch:', error);
        throw error;
      } finally {
        setIsWatching(false);
      }
    },
    [user],
  );

  return {
    trackWatch,
    isWatching,
    progress,
  };
}
