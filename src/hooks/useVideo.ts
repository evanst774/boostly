// src/hooks/useVideo.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { type Video } from '@/lib/db/schema';

interface UseVideoProps {
  videoId: string;
  includeEngagement?: boolean;
}

export function useVideo({
  videoId,
  includeEngagement = false,
}: UseVideoProps) {
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchVideo = useCallback(async () => {
    if (!user || !videoId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (includeEngagement) params.append('includeEngagement', 'true');

      const response = await fetch(`/api/content/videos/${videoId}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }

      const result = await response.json();
      setVideo(result.video);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch video'));
    } finally {
      setIsLoading(false);
    }
  }, [user, videoId, includeEngagement]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  return {
    video,
    isLoading,
    error,
    refetch: fetchVideo,
  };
}
