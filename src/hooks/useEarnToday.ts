// src/hooks/useEarnToday.ts
import { useCallback, useEffect, useState } from 'react';

export interface TaskProgress {
  key: 'videos' | 'games' | 'surveys';
  label: string;
  href: string;
  done: number;
  limit: number;
  remaining: number;
}

export interface WithdrawalEligibility {
  canWithdraw: boolean;
  reason: string | null;
  balance: number;
  pendingAmount: number;
  minAmount: number;
  plan: { tier: string; name: string; isFree: boolean };
  intervalDays: number;
  frequencyLabel: string;
  nextAllowedAt: string;
  nextPayoutAt: string;
  lastPhoneNumber: string | null;
  lastAccountName: string | null;
}

export interface LedgerEntry {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  referenceType: string | null;
  createdAt: string;
}

export interface EarnToday {
  plan: {
    tier: string;
    name: string;
    isFree: boolean;
    expiresAt: string | null;
    estimatedDailyEarnings: number;
    /** Most RWF a member can earn from tasks per day (0 = no maximum). */
    dailyEarningsMax: number;
    withdrawalIntervalDays: number;
  };
  todayTaskEarnings: number;
  tasks: TaskProgress[];
  totals: { done: number; limit: number };
  wallet: {
    balance: number;
    pendingWithdrawal: number;
    totalEarned: number;
    totalWithdrawn: number;
    currency: string;
  };
  earnings: { today: number; week: number; month: number; total: number };
  streak: { current: number; nextMilestone: { day: number; bonus: number } | null };
  withdrawal: WithdrawalEligibility;
  dailyBonus: { amount: number; claimed: boolean; streakDay: number } | null;
  recentTransactions: LedgerEntry[];
}

export function useEarnToday() {
  const [data, setData] = useState<EarnToday | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/earn/today', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

export function useWithdrawalEligibility() {
  const [data, setData] = useState<WithdrawalEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/withdrawals/eligibility', {
        cache: 'no-store',
      });
      if (res.ok) setData(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, refetch: load };
}
