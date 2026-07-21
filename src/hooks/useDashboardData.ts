// src/hooks/useDashboardData.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  stats: {
    balance: number;
    todayEarnings: number;
    monthlyEarnings: number;
    totalEarnings: number;
    streak: number;
    videoEarnings: number;
    gameEarnings: number;
    bonusEarnings: number;
    referralEarnings: number;
  };
  transactions: Array<{
    id: string;
    type:
      | 'video'
      | 'game'
      | 'bonus'
      | 'referral'
      | 'withdrawal'
      | 'badge'
      | 'subscription';
    description: string;
    date: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed' | 'cancelled';
  }>;
  chartData: Array<{ day: string; amount: number }>;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch wallet data
        const walletRes = await fetch('/api/wallet');
        const walletData = await walletRes.json();

        // Fetch rewards summary
        const rewardsRes = await fetch('/api/rewards/stats');
        const rewardsData = await rewardsRes.json();

        // Fetch recent transactions
        const txRes = await fetch('/api/transactions?limit=10');
        const txData = await txRes.json();

        // Fetch streak info
        const streakRes = await fetch('/api/daily-bonus/streak');
        const streakData = await streakRes.json();

        // Fetch earnings breakdown
        const earningsRes = await fetch('/api/rewards/earnings/breakdown');
        const earningsData = await earningsRes.json();

        setData({
          stats: {
            balance: walletData.balance || 0,
            todayEarnings: rewardsData.today || 0,
            monthlyEarnings: rewardsData.monthly || 0,
            totalEarnings: rewardsData.total || 0,
            streak: streakData.streak || 0,
            videoEarnings: earningsData.video || 0,
            gameEarnings: earningsData.game || 0,
            bonusEarnings: earningsData.bonus || 0,
            referralEarnings: earningsData.referral || 0,
          },
          transactions: txData.transactions || [],
          chartData: earningsData.chart || defaultChartData,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch dashboard data'),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { data, isLoading, error };
}

const defaultChartData = [
  { day: 'Mon', amount: 0 },
  { day: 'Tue', amount: 0 },
  { day: 'Wed', amount: 0 },
  { day: 'Thu', amount: 0 },
  { day: 'Fri', amount: 0 },
  { day: 'Sat', amount: 0 },
  { day: 'Sun', amount: 0 },
];
