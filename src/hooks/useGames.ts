// src/hooks/useGames.ts
import { useEffect, useState, useCallback } from 'react';
import {
  type Game,
  type GameCategory,
  type GameStatus,
} from '@/lib/db/schema';

// Re-export types from schema for convenience
export type { Game, GameCategory, GameStatus };

// Use the schema's Game type directly
interface GamesResponse {
  games: Game[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseGamesProps {
  category?: GameCategory;
  status?: GameStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function useGames({
  category,
  status,
  search,
  page = 1,
  limit = 20,
}: UseGamesProps = {}) {
  const [data, setData] = useState<GamesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/content/games?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const result: GamesResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch games'));
    } finally {
      setIsLoading(false);
    }
  }, [category, status, search, page, limit]);

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
