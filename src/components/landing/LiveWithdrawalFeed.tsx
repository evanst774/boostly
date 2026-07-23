// src/components/landing/LiveWithdrawalFeed.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import { cn } from '@/lib/utils';

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

// ─── Skeleton Component ──────────────────────────────

function WithdrawalFeedSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border-light p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Wallet size={16} className="text-primary/30" />
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
            <div className="w-10 h-10 rounded-full bg-border" />
            <div className="flex-1">
              <div className="w-32 h-4 bg-border rounded" />
              <div className="w-20 h-3 bg-border rounded mt-1" />
            </div>
            <div className="w-16 h-6 bg-border rounded-full" />
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
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet size={16} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold text-navy">Live Withdrawals</h3>
        <span className="text-xs text-text-muted ml-auto">No activity</span>
      </div>
      <div className="text-center py-8 sm:py-12">
        <div className="text-4xl mb-3">💰</div>
        <p className="text-text-muted text-sm">No recent withdrawals</p>
        <p className="text-text-muted text-xs mt-1">Check back soon!</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────

export function LiveWithdrawalFeed() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { formatAmount, isLoading: currencyLoading } = useSystemCurrency();

  // ─── Detect mobile ──────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ─── Type guard ─────────────────────────────────────
  function isApiResponse(data: unknown): data is ApiResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'withdrawals' in data &&
      Array.isArray((data as { withdrawals: unknown }).withdrawals)
    );
  }

  // ─── Fetch withdrawals ──────────────────────────────
  const fetchWithdrawals = useCallback(async () => {
    try {
      setIsLoading(true);
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

  // ─── Navigation ─────────────────────────────────────
  const goToNext = useCallback(() => {
    if (withdrawals.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % withdrawals.length);
  }, [withdrawals.length]);

  const goToPrevious = useCallback(() => {
    if (withdrawals.length === 0) return;
    setCurrentIndex(
      (prev) => (prev - 1 + withdrawals.length) % withdrawals.length,
    );
  }, [withdrawals.length]);

  // ─── Auto-rotate ─────────────────────────────────────
  useEffect(() => {
    if (isPaused || isLoading || withdrawals.length === 0) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(goToNext, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [withdrawals.length, isLoading, isPaused, goToNext]);

  // ─── Initial fetch ──────────────────────────────────
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // ─── Format amount ──────────────────────────────────
  const formatWithdrawalAmount = (amount: number, currency: string) => {
    if (currencyLoading) {
      return `${amount.toLocaleString()} ${currency}`;
    }
    try {
      return formatAmount(amount);
    } catch {
      return `${amount.toLocaleString()} ${currency}`;
    }
  };

  // ─── Loading state ──────────────────────────────────
  if (isLoading) {
    return <WithdrawalFeedSkeleton />;
  }

  // ─── Empty state ────────────────────────────────────
  if (withdrawals.length === 0) {
    return <EmptyState />;
  }

  const currentWithdrawal = withdrawals[currentIndex % withdrawals.length];
  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex === withdrawals.length - 1;

  return (
    <div
      className="bg-white rounded-2xl border border-border-light p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Wallet size={14} className="text-primary" />
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-navy">
          Live Withdrawals
        </h3>
        <div className="flex items-center gap-2 ml-auto">
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="hidden sm:inline">Live</span>
          </span>
          <span className="text-[10px] sm:text-xs text-text-muted hidden sm:inline">
            {withdrawals.length} recent
          </span>
        </div>
      </div>

      {/* Withdrawal Card */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWithdrawal.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl bg-gradient-to-r from-bg to-transparent border border-border overflow-hidden"
          >
            {/* Icon */}
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gold/20 flex items-center justify-center text-lg sm:text-2xl flex-shrink-0">
              💰
            </div>

            {/* Content - Fixed overflow */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-navy truncate">
                <span className="font-bold truncate max-w-[60px] sm:max-w-none inline-block">
                  {currentWithdrawal.displayName}
                </span>{' '}
                <span className="hidden xs:inline">withdrew</span>{' '}
                <span className="font-bold text-success truncate inline-block max-w-[80px] sm:max-w-none">
                  {formatWithdrawalAmount(
                    currentWithdrawal.amount,
                    currentWithdrawal.currency,
                  )}
                </span>
              </p>
              <p className="text-[10px] sm:text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <Clock size={10} className="flex-shrink-0" />
                <span className="truncate">{currentWithdrawal.timeAgo}</span>
              </p>
            </div>

            {/* Status Badge - Smaller on mobile */}
            <div className="flex-shrink-0">
              <span className="text-[8px] sm:text-xs font-semibold text-success bg-success/10 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-full whitespace-nowrap">
                ✓ <span className="hidden xs:inline">Completed</span>
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Mobile & Desktop */}
        {withdrawals.length > 1 && (
          <>
            {/* Desktop arrows */}
            <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -left-3 -right-3 justify-between pointer-events-none">
              <button
                onClick={goToPrevious}
                disabled={isAtStart}
                className="pointer-events-auto w-8 h-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center text-text-muted hover:text-navy hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous withdrawal"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={goToNext}
                disabled={isAtEnd}
                className="pointer-events-auto w-8 h-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center text-text-muted hover:text-navy hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next withdrawal"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Mobile arrows - inside card */}
            {isMobile && (
              <div className="flex gap-2 mt-2 justify-center">
                <button
                  onClick={goToPrevious}
                  disabled={isAtStart}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                  aria-label="Previous withdrawal"
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="text-[10px] text-text-muted flex items-center">
                  {currentIndex + 1} / {withdrawals.length}
                </span>
                <button
                  onClick={goToNext}
                  disabled={isAtEnd}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                  aria-label="Next withdrawal"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1 mt-3 sm:mt-4">
        {withdrawals.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'h-1 rounded-full transition-all duration-300 cursor-pointer touch-manipulation',
              index === currentIndex % 5
                ? 'w-4 sm:w-6 bg-gold'
                : 'w-2 sm:w-3 bg-border hover:bg-gray-300',
            )}
            aria-label={`Go to withdrawal ${index + 1}`}
          />
        ))}
        {withdrawals.length > 5 && (
          <span className="text-[10px] text-text-muted ml-1">
            +{withdrawals.length - 5}
          </span>
        )}
      </div>

      {/* Counter */}
      <p className="text-[10px] text-text-muted/60 text-center mt-1.5 sm:mt-2">
        {currentIndex + 1} of {withdrawals.length} recent withdrawals
      </p>
    </div>
  );
}
