// src/hooks/useEarningsStats.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { type Reward } from '@/lib/db/schema';

export type { Reward };

type Period = 'week' | 'month' | 'year' | 'all';

interface EarningsBreakdown {
  type: string;
  amount: number;
  percentage: number;
}

interface EarningsStats {
  total: number;
  change: number;
  breakdown: EarningsBreakdown[];
  chart: Array<{
    label: string;
    amount: number;
  }>;
  bestDay: {
    date: string;
    amount: number;
  } | null;
  averageDaily: number;
  highest: number;
  streak: number;
}

export function useEarningsStats(period: Period = 'month') {
  const [data, setData] = useState<EarningsStats | null>(null);
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
      const response = await fetch(
        `/api/rewards/earnings/stats?period=${period}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch earnings stats');
      }

      const result: EarningsStats = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to fetch earnings stats'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, period]);

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
