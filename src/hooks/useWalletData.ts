// src/hooks/useWalletData.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  type Wallet,
  type Transaction,
  type Withdrawal,
} from '@/lib/db/schema';

// Re-export schema types
export type { Wallet, Transaction, Withdrawal };

interface WalletData {
  wallet: Wallet;
  transactions: Transaction[];
  cryptoBalances: Array<{
    currency: string;
    network?: string;
    balance: string;
    usdValue: number;
    address?: string;
    icon?: string;
  }>;
}

export function useWalletData() {
  const [data, setData] = useState<WalletData | null>(null);
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
      const [walletRes, txRes, cryptoRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/transactions?limit=10'),
        fetch('/api/crypto/balances'),
      ]);

      if (!walletRes.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const walletData = await walletRes.json();
      const txData = await txRes.json();
      const cryptoData = await cryptoRes.json();

      setData({
        wallet: walletData,
        transactions: txData.transactions || [],
        cryptoBalances: cryptoData.balances || [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch wallet data'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
