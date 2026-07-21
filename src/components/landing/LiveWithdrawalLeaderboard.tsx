// src/components/landing/LiveWithdrawalLeaderboard.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';

interface TopWithdrawer {
  rank: number;
  userId: string;
  userName: string;
  totalWithdrawn: number;
  currency: string;
  withdrawalsCount: number;
  badge?: string;
}

export function LiveWithdrawalLeaderboard() {
  const [topWithdrawers, setTopWithdrawers] = useState<TopWithdrawer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/public/withdrawals/leaderboard?period=${period}&limit=5`,
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
        return <Crown size={18} className="text-gold" />;
      case 2:
        return <Medal size={18} className="text-[#94A3B8]" />;
      case 3:
        return <Medal size={18} className="text-[#CD7F32]" />;
      default:
        return (
          <span className="text-sm font-bold text-text-muted">#{rank}</span>
        );
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30';
      case 2:
        return 'bg-gradient-to-br from-[#94A3B8]/20 to-[#94A3B8]/10 border-[#94A3B8]/30';
      case 3:
        return 'bg-gradient-to-br from-[#CD7F32]/20 to-[#CD7F32]/10 border-[#CD7F32]/30';
      default:
        return 'bg-bg';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-border-light p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-gold" />
            <h3 className="text-sm font-bold text-navy">Top Withdrawers</h3>
          </div>
          <div className="animate-pulse w-24 h-8 bg-border rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-xl bg-bg animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-border" />
              <div className="flex-1">
                <div className="w-24 h-4 bg-border rounded" />
                <div className="w-16 h-3 bg-border rounded mt-1" />
              </div>
              <div className="w-20 h-4 bg-border rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topWithdrawers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-gold" />
          <h3 className="text-sm font-bold text-navy">🏆 Top Withdrawers</h3>
          <span className="text-xs text-text-muted">This {period}</span>
        </div>
        <div className="flex gap-1 bg-bg rounded-lg p-0.5">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                period === p
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-text-muted hover:text-navy'
              }`}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {topWithdrawers.map((item) => (
          <motion.div
            key={item.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: item.rank * 0.05 }}
            className={`flex items-center gap-4 p-3 rounded-xl border ${getRankBg(item.rank)}`}
          >
            <div className="w-8 text-center flex-shrink-0">
              {getRankIcon(item.rank)}
            </div>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {item.userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-navy">{item.userName}</p>
                {item.badge && (
                  <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {item.withdrawalsCount} withdrawal
                {item.withdrawalsCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-success">
                {item.totalWithdrawn.toLocaleString()} {item.currency}
              </p>
              <p className="text-[10px] text-text-muted">withdrawn</p>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-text-muted text-center mt-4 border-t border-border pt-4">
        Updated daily · Top withdrawers this {period}
      </p>
    </div>
  );
}
