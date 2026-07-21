// src/hooks/useVideos.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  type Video,
  type VideoCategory,
  type VideoStatus,
  type VideoWatch,
} from '@/lib/db/schema';

// Re-export schema types for convenience
export type { Video, VideoCategory, VideoStatus, VideoWatch };

// Video with watch progress (API response)
export interface VideoWithProgress extends Video {
  watchProgress?: number;
  isWatched?: boolean;
  engagementStats?: {
    likes: number;
    dislikes: number;
    shares: number;
    saves: number;
  };
  userEngagement?: {
    liked: boolean;
    disliked: boolean;
    saved: boolean;
    shared: boolean;
  };
}

interface VideosStats {
  totalEarned: number;
  watched: number;
  available: number;
}

interface VideosResponse {
  videos: VideoWithProgress[];
  stats?: VideosStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseVideosProps {
  category?: VideoCategory;
  status?: VideoStatus;
  search?: string;
  page?: number;
  limit?: number;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  isSponsored?: boolean;
  tag?: string;
  includeEngagement?: boolean;
}

export function useVideos({
  category,
  status,
  search,
  page = 1,
  limit = 20,
  difficulty,
  isSponsored,
  tag,
  includeEngagement = false,
}: UseVideosProps = {}) {
  const [data, setData] = useState<VideosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      if (difficulty) params.append('difficulty', difficulty);
      if (isSponsored !== undefined)
        params.append('isSponsored', String(isSponsored));
      if (tag) params.append('tag', tag);
      if (includeEngagement) params.append('includeEngagement', 'true');
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/content/videos?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const result: VideosResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch videos'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    category,
    status,
    search,
    page,
    limit,
    difficulty,
    isSponsored,
    tag,
    includeEngagement,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
