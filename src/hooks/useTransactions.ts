// src/hooks/useTransactions.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { type Transaction } from '@/lib/db/schema';

export type { Transaction };

type TransactionType =
  | 'all'
  | 'earnings'
  | 'withdrawals'
  | 'bonuses'
  | 'referrals';
type TransactionStatus = 'all' | 'completed' | 'pending' | 'failed';

interface TransactionSummary {
  totalEarned: number;
  totalWithdrawn: number;
  pending: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  summary: TransactionSummary;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseTransactionsProps {
  type?: TransactionType;
  status?: TransactionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function useTransactions({
  type = 'all',
  status = 'all',
  search = '',
  page = 1,
  limit = 10,
}: UseTransactionsProps = {}) {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        status: status !== 'all' ? status : '',
        search,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/transactions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result: TransactionsResponse = await response.json();
      setData(result);
      setTotalPages(Math.ceil((result.total || 0) / limit));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch transactions'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, type, status, search, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    totalPages,
    refetch: fetchData,
  };
}
