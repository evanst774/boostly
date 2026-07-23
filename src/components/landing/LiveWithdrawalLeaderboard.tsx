// src/components/landing/LiveWithdrawalLeaderboard.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
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

// ─── Skeleton Component ──────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border-light p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-gold" />
          <h3 className="text-sm font-bold text-navy">Top Withdrawers</h3>
        </div>
        <div className="animate-pulse w-32 h-8 bg-border rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-bg animate-pulse"
          >
            <div className="w-8 h-8 rounded-full bg-border" />
            <div className="w-9 h-9 rounded-full bg-border" />
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

// ─── Empty State ──────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-border-light p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-gold" />
        <h3 className="text-sm font-bold text-navy">Top Withdrawers</h3>
      </div>
      <div className="text-center py-8 sm:py-12">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-text-muted text-sm">No top withdrawers yet</p>
        <p className="text-text-muted text-xs mt-1">Be the first!</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────

export function LiveWithdrawalLeaderboard() {
  const [topWithdrawers, setTopWithdrawers] = useState<TopWithdrawer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [isMobile, setIsMobile] = useState(false);
  const {
    formatAmount,
    // Remove unused currency variable
    isLoading: currencyLoading,
  } = useSystemCurrency();

  // ─── Detect mobile ──────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ─── Fetch leaderboard ──────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
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
  }, [period]);

  // ─── Fetch when period changes ──────────────────────
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ─── Get rank icon ──────────────────────────────────
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={isMobile ? 16 : 18} className="text-gold" />;
      case 2:
        return <Medal size={isMobile ? 16 : 18} className="text-[#94A3B8]" />;
      case 3:
        return <Medal size={isMobile ? 16 : 18} className="text-[#CD7F32]" />;
      default:
        return (
          <span className="text-xs sm:text-sm font-bold text-text-muted">
            #{rank}
          </span>
        );
    }
  };

  // ─── Get rank background ────────────────────────────
  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30';
      case 2:
        return 'bg-gradient-to-br from-[#94A3B8]/20 to-[#94A3B8]/10 border-[#94A3B8]/30';
      case 3:
        return 'bg-gradient-to-br from-[#CD7F32]/20 to-[#CD7F32]/10 border-[#CD7F32]/30';
      default:
        return 'bg-bg border-border';
    }
  };

  // ─── Format amount ──────────────────────────────────
  const formatWithdrawnAmount = (amount: number, currencyCode: string) => {
    if (currencyLoading) {
      return `${amount.toLocaleString()} ${currencyCode}`;
    }
    try {
      // Use system currency for formatting
      return formatAmount(amount);
    } catch {
      return `${amount.toLocaleString()} ${currencyCode}`;
    }
  };

  // ─── Get initials ───────────────────────────────────
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ─── Loading state ──────────────────────────────────
  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  // ─── Empty state ────────────────────────────────────
  if (topWithdrawers.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-2xl border border-border-light p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
            <Trophy size={16} className="text-gold" />
          </div>
          <h3 className="text-sm font-bold text-navy">🏆 Top Withdrawers</h3>
          <span className="text-xs text-text-muted hidden sm:inline">
            This {period}
          </span>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-1 bg-bg rounded-lg p-0.5 w-full sm:w-auto">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              className={cn(
                'flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize touch-manipulation',
                period === p
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-text-muted hover:text-navy',
              )}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {topWithdrawers.map((item) => {
            const initials = getInitials(item.userName);
            const isTopThree = item.rank <= 3;

            return (
              <motion.div
                key={item.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, delay: item.rank * 0.05 }}
                className={cn(
                  'flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-xl border transition-all duration-200 hover:shadow-sm',
                  getRankBg(item.rank),
                )}
              >
                {/* Rank */}
                <div className="w-6 sm:w-8 text-center flex-shrink-0">
                  {getRankIcon(item.rank)}
                </div>

                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                    isTopThree
                      ? 'bg-gradient-to-br from-primary to-gold'
                      : 'bg-primary',
                  )}
                >
                  {initials}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-navy truncate">
                      {item.userName}
                    </p>
                    {item.badge && (
                      <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {item.withdrawalsCount} withdrawal
                    {item.withdrawalsCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-success whitespace-nowrap">
                    {formatWithdrawnAmount(item.totalWithdrawn, item.currency)}
                  </p>
                  <p className="text-[10px] text-text-muted hidden sm:block">
                    withdrawn
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
        <p className="text-[10px] text-text-muted text-center sm:text-left">
          Updated daily · Top withdrawers this {period}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <TrendingUp size={12} className="text-success" />
          <span>Leaderboard</span>
        </div>
      </div>
    </div>
  );
}
