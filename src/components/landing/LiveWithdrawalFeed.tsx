// src/components/landing/LiveWithdrawalFeed.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Clock } from 'lucide-react';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

interface Withdrawal {
  id: string;
  displayName: string;
  amount: number;
  currency: string;
  timeAgo: string;
  timestamp: string;
}

interface ApiResponse {
  withdrawals: Array<{
    id: string;
    displayName: string;
    amount: number;
    currency: string;
    timeAgo: string;
    timestamp: string;
  }>;
}

export function LiveWithdrawalFeed() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { formatAmount } = useSystemCurrency();

  // Type guard for API response
  function isApiResponse(data: unknown): data is ApiResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'withdrawals' in data &&
      Array.isArray((data as { withdrawals: unknown }).withdrawals)
    );
  }

  const fetchWithdrawals = useCallback(async () => {
    try {
      const response = await fetch('/api/public/withdrawals/recent?limit=20');
      const data = await response.json();

      if (isApiResponse(data)) {
        setWithdrawals(data.withdrawals);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-rotate through withdrawals
  useEffect(() => {
    if (isPaused || isLoading || withdrawals.length === 0) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(withdrawals.length, 1));
    }, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [withdrawals.length, isLoading, isPaused]);

  // Initial fetch
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Handle pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Format amount with system currency
  const formatWithdrawalAmount = (amount: number, currency: string) => {
    // Use system currency formatting if available, fallback to provided currency
    try {
      return formatAmount(amount);
    } catch {
      return `${amount.toLocaleString()} ${currency}`;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-border-light p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-bold text-navy">Live Withdrawals</h3>
          <span className="text-xs text-text-muted ml-auto">Loading...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-border" />
              <div className="flex-1">
                <div className="w-32 h-4 bg-border rounded" />
                <div className="w-20 h-3 bg-border rounded mt-1" />
              </div>
              <div className="w-16 h-4 bg-border rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border-light p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-bold text-navy">Live Withdrawals</h3>
          <span className="text-xs text-text-muted ml-auto">No activity</span>
        </div>
        <div className="text-center py-8">
          <p className="text-text-muted text-sm">No recent withdrawals</p>
          <p className="text-text-muted text-xs mt-1">Check back soon!</p>
        </div>
      </div>
    );
  }

  const currentWithdrawal = withdrawals[currentIndex % withdrawals.length];

  return (
    <div
      className="bg-white rounded-2xl border border-border-light p-6 shadow-sm hover:shadow-md transition-shadow"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet size={16} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold text-navy">Live Withdrawals</h3>
        <span className="text-xs text-text-muted ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </span>
        <span className="text-xs text-text-muted">
          {withdrawals.length} recent
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentWithdrawal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-bg to-transparent border border-border"
        >
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold text-lg flex-shrink-0">
            💰
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy">
              <span className="font-bold">{currentWithdrawal.displayName}</span>{' '}
              withdrew{' '}
              <span className="font-bold text-success">
                {formatWithdrawalAmount(
                  currentWithdrawal.amount,
                  currentWithdrawal.currency,
                )}
              </span>
            </p>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
              <Clock size={12} />
              {currentWithdrawal.timeAgo}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
              ✓ Completed
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-4">
        {withdrawals.slice(0, 5).map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex % 5 ? 'w-6 bg-gold' : 'w-3 bg-border'
            }`}
          />
        ))}
        {withdrawals.length > 5 && (
          <span className="text-[10px] text-text-muted ml-1">
            +{withdrawals.length - 5}
          </span>
        )}
      </div>
    </div>
  );
}
