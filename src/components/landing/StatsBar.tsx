// src/components/landing/StatsBar.tsx

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

interface Stat {
  id: string;
  icon: string;
  value: string | number;
  label: string;
  color: string;
  isCurrency?: boolean;
}

interface RawStats {
  totalUsers: number;
  totalRewardsPaid: number;
  totalVideosWatched: number;
  totalGamesPlayed: number;
  userSatisfaction: number;
}

// Animation variants
const statsContainerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const statItemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// Skeleton loading component
function StatsBarSkeleton() {
  return (
    <section className="bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-16" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pure formatting helpers — module scope, no re-creation, no dependency-array footguns
function formatUserCount(count: number): string {
  if (count === 0) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M+`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
  return count.toString();
}

function formatCount(count: number): string {
  if (count === 0) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M+`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
  return count.toString();
}

function formatPercentage(value: number): string {
  if (value === 0) return '0%';
  return `${value}%`;
}

export function StatsBar() {
  const [rawStats, setRawStats] = useState<RawStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    currency,
    formatAmount,
    isLoading: currencyLoading,
  } = useSystemCurrency();

  // Fetch raw stats exactly ONCE on mount.
  // This no longer depends on currency/formatAmount, so it can never
  // re-trigger just because those values change identity on re-render.
  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/public/stats');

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();

        if (!cancelled) {
          setRawStats({
            totalUsers: data.totalUsers || 0,
            totalRewardsPaid: data.totalRewardsPaid || 0,
            totalVideosWatched: data.totalVideosWatched || 0,
            totalGamesPlayed: data.totalGamesPlayed || 0,
            userSatisfaction: data.userSatisfaction || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        if (!cancelled) {
          setError('Failed to load stats');
          setRawStats(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, []); // <-- runs once, period.

  // Format currency value using system currency.
  // Wrapped in useCallback so it has a stable identity tied to its actual
  // dependencies, instead of being recreated (and re-triggering downstream
  // memoization) on every single render.
  const formatCurrencyValue = useCallback(
    (amount: number): string => {
      if (amount === 0) return `${currency.symbol}0`;

      try {
        const symbol = currency.symbol;

        if (amount >= 1000000) {
          const value = (amount / 1000000).toFixed(1);
          const cleanValue = value.endsWith('.0') ? value.slice(0, -2) : value;
          return `${symbol} ${cleanValue}M+`;
        }

        if (amount >= 1000) {
          const value = (amount / 1000).toFixed(1);
          const cleanValue = value.endsWith('.0') ? value.slice(0, -2) : value;
          return `${symbol} ${cleanValue}K+`;
        }

        return formatAmount(amount);
      } catch {
        const symbol = currency.symbol || '';
        if (amount >= 1000000) {
          const value = (amount / 1000000).toFixed(1);
          const cleanValue = value.endsWith('.0') ? value.slice(0, -2) : value;
          return `${symbol} ${cleanValue}M+`;
        }
        if (amount >= 1000) {
          const value = (amount / 1000).toFixed(1);
          const cleanValue = value.endsWith('.0') ? value.slice(0, -2) : value;
          return `${symbol} ${cleanValue}K+`;
        }
        return `${symbol} ${amount.toLocaleString()}`;
      }
    },
    [currency, formatAmount],
  );

  // Derive the display-ready stats purely from data already in memory.
  // Recalculating this on a currency change is cheap and does NOT touch the network.
  const stats: Stat[] = useMemo(() => {
    if (!rawStats) return [];

    return [
      {
        id: 'users',
        icon: '👥',
        value: formatUserCount(rawStats.totalUsers),
        label: 'Active Users',
        color: 'bg-primary',
        isCurrency: false,
      },
      {
        id: 'rewards',
        icon: '💰',
        value: formatCurrencyValue(rawStats.totalRewardsPaid),
        label: 'Rewards Paid Out',
        color: 'bg-success',
        isCurrency: true,
      },
      {
        id: 'videos',
        icon: '▶️',
        value: formatCount(rawStats.totalVideosWatched),
        label: 'Videos Watched',
        color: 'bg-purple',
        isCurrency: false,
      },
      {
        id: 'games',
        icon: '🎮',
        value: formatCount(rawStats.totalGamesPlayed),
        label: 'Games Played',
        color: 'bg-warning',
        isCurrency: false,
      },
      {
        id: 'satisfaction',
        icon: '⭐',
        value: formatPercentage(rawStats.userSatisfaction),
        label: 'User Satisfaction',
        color: 'bg-pink',
        isCurrency: false,
      },
    ];
  }, [rawStats, formatCurrencyValue]);

  // Show skeleton loading
  if (isLoading || currencyLoading) {
    return <StatsBarSkeleton />;
  }

  // Show error state with retry
  if (error) {
    return (
      <section className="bg-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // If no stats and not loading, show empty state
  if (stats.length === 0) {
    return (
      <section className="bg-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              No statistics available
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={statsContainerVariants}
      className="bg-white border-b border-border-light"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {stats.map(({ id, icon, value, label, color, isCurrency }) => (
            <motion.div
              key={id}
              variants={statItemVariants}
              whileHover="hover"
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${color} flex items-center justify-center flex-shrink-0 text-white text-lg sm:text-xl`}
              >
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-xl font-black leading-none truncate">
                  {value}
                </p>
                <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 truncate">
                  {label}
                </p>
                {isCurrency && currency && (
                  <p className="text-[8px] sm:text-[10px] text-text-muted mt-0.5">
                    in {currency.code}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
