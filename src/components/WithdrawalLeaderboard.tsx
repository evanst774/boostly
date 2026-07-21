// src/components/WithdrawalLeaderboard.tsx

'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopWithdrawer {
  rank: number;
  userId: string;
  userName: string;
  totalWithdrawn: number;
  currency: string;
  withdrawalsCount: number;
  badge?: string;
}

export function WithdrawalLeaderboard() {
  const [topWithdrawers, setTopWithdrawers] = useState<TopWithdrawer[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopWithdrawers();
  }, [period]);

  const fetchTopWithdrawers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/public/withdrawals/leaderboard?period=${period}`,
      );
      const data = await response.json();
      setTopWithdrawers(data.withdrawers || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={20} className="text-[#F59E0B]" />;
      case 2:
        return <Medal size={20} className="text-[#94A3B8]" />;
      case 3:
        return <Medal size={20} className="text-[#CD7F32]" />;
      default:
        return (
          <span className="text-sm font-bold text-[#6B7280]">#{rank}</span>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-[#F59E0B] to-[#D97706]';
      case 2:
        return 'bg-gradient-to-br from-[#94A3B8] to-[#64748B]';
      case 3:
        return 'bg-gradient-to-br from-[#CD7F32] to-[#B45309]';
      default:
        return 'bg-gradient-to-br from-[#60A5FA] to-[#2563EB]';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (topWithdrawers.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-2xl border border-[#F3F4F6]">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-[#6B7280] font-medium">No withdrawals yet</p>
        <p className="text-xs text-[#9CA3AF] mt-1">Be the first to withdraw!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-[#F59E0B]" />
          <h3 className="text-sm font-bold">Top Withdrawers</h3>
        </div>
        <div className="flex gap-1 bg-[#F8FAFC] rounded-lg p-0.5">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all capitalize',
                period === p
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]',
              )}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-[#F3F4F6]">
        {topWithdrawers.map((item) => (
          <div
            key={item.userId}
            className={cn(
              'flex items-center gap-4 px-5 py-3',
              item.rank <= 3 && 'bg-[#F8FAFC]',
            )}
          >
            {/* Rank */}
            <div className="w-8 text-center flex-shrink-0">
              {getRankIcon(item.rank)}
            </div>

            {/* Avatar */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                getRankColor(item.rank),
              )}
            >
              {item.userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#111827]">
                  {item.userName}
                </p>
                {item.badge && (
                  <span className="text-[10px] font-bold text-[#22C55E] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
                {item.withdrawalsCount} withdrawal
                {item.withdrawalsCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[#22C55E]">
                {item.totalWithdrawn.toLocaleString()} {item.currency}
              </p>
              <p className="text-[10px] text-[#6B7280]">withdrawn</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[#F3F4F6] bg-[#F8FAFC]">
        <p className="text-xs text-[#6B7280] text-center">
          Updated daily · Top withdrawers this {period}
        </p>
      </div>
    </div>
  );
}
