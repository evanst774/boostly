// src/hooks/useReferrals.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { type Referral, type ReferralCode } from '@/lib/db/schema';

// Re-export schema types for convenience
export type { Referral, ReferralCode };

// Extended types for API responses
interface ReferralWithUser extends Omit<Referral, 'referrerId' | 'refereeId'> {
  referrer: {
    id: string;
    name: string;
    email: string;
  };
  referee: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReferralStats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  totalEarned: number;
}

interface ReferralFriend {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'completed';
  date: string;
  reward: number;
}

interface ReferralsData {
  stats: ReferralStats;
  referrals: ReferralWithUser[];
  friends: ReferralFriend[];
}

export function useReferrals() {
  const [data, setData] = useState<ReferralsData | null>(null);
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
      const [statsRes, referralsRes] = await Promise.all([
        fetch('/api/referrals/stats'),
        fetch('/api/referrals'),
      ]);

      if (!statsRes.ok) {
        throw new Error('Failed to fetch referral stats');
      }
      if (!referralsRes.ok) {
        throw new Error('Failed to fetch referrals');
      }

      const stats: ReferralStats = await statsRes.json();
      const referrals = await referralsRes.json();

      setData({
        stats,
        referrals: referrals.referrals || [],
        friends: referrals.friends || [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch referrals'),
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
