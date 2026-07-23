// src/components/WithdrawalToast.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wallet,
  X,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WithdrawalNotification {
  id: string;
  displayName: string;
  amount: number;
  currency: string;
  timestamp: string;
}

interface WithdrawalToastProps {
  interval?: number;
  showDuration?: number;
  maxNotifications?: number;
}

interface ApiResponse {
  withdrawals: Array<{
    id: string;
    displayName: string;
    amount: number;
    currency: string;
    timestamp: string;
  }>;
}

const FADE_MS = 500;

export function WithdrawalToast({
  interval = 50000,
  showDuration = 6000,
  maxNotifications = 200,
}: WithdrawalToastProps) {
  const [currentToast, setCurrentToast] =
    useState<WithdrawalNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<WithdrawalNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const timersRef = useRef<{
    showTimer: NodeJS.Timeout | null;
    hideTimer: NodeJS.Timeout | null;
    intervalTimer: NodeJS.Timeout | null;
  }>({
    showTimer: null,
    hideTimer: null,
    intervalTimer: null,
  });

  const isMounted = useRef(true);

  // ─── Detect mobile ──────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ─── Type guard ──────────────────────────────────
  function isApiResponse(data: unknown): data is ApiResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'withdrawals' in data &&
      Array.isArray((data as { withdrawals: unknown }).withdrawals)
    );
  }

  // ─── Clean up all timers ──────────────────────
  const clearAllTimers = useCallback(() => {
    const { showTimer, hideTimer, intervalTimer } = timersRef.current;
    if (showTimer) clearTimeout(showTimer);
    if (hideTimer) clearTimeout(hideTimer);
    if (intervalTimer) clearTimeout(intervalTimer);
    timersRef.current = {
      showTimer: null,
      hideTimer: null,
      intervalTimer: null,
    };
  }, []);

  // ─── Fetch recent withdrawals ──────────────────
  const fetchRecentWithdrawals = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/public/withdrawals/latest?limit=${maxNotifications}`,
      );
      const data = await response.json();

      if (isApiResponse(data) && data.withdrawals.length > 0) {
        const shuffled = shuffleArray(data.withdrawals);
        setToasts(shuffled);
        setCurrentIndex(0);
        setCurrentToast(shuffled[0]);
      } else {
        const demoData = generateDemoWithdrawals();
        setToasts(demoData);
        setCurrentIndex(0);
        setCurrentToast(demoData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal notifications:', error);
      const demoData = generateDemoWithdrawals();
      setToasts(demoData);
      setCurrentIndex(0);
      setCurrentToast(demoData[0]);
    } finally {
      setIsLoading(false);
    }
  }, [maxNotifications]);

  // ─── Show next toast ────────────────────────────
  const showNextToast = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (toasts.length === 0) return prevIndex;
      const nextIndex = (prevIndex + 1) % toasts.length;
      setCurrentToast(toasts[nextIndex]);
      return nextIndex;
    });
  }, [toasts]);

  // ─── Show previous toast ────────────────────────
  const showPreviousToast = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (toasts.length === 0) return prevIndex;
      const nextIndex = (prevIndex - 1 + toasts.length) % toasts.length;
      setCurrentToast(toasts[nextIndex]);
      return nextIndex;
    });
  }, [toasts]);

  // ─── Start rotation ─────────────────────────────
  const startRotation = useCallback(() => {
    clearAllTimers();

    if (isPaused || isLoading || toasts.length === 0 || !isMounted.current) {
      return;
    }

    timersRef.current.showTimer = setTimeout(() => {
      if (!isMounted.current) return;
      setIsVisible(false);

      timersRef.current.hideTimer = setTimeout(() => {
        if (!isMounted.current) return;

        timersRef.current.intervalTimer = setTimeout(() => {
          if (!isMounted.current) return;
          showNextToast();
          setIsVisible(true);
          startRotation();
        }, interval);
      }, FADE_MS);
    }, showDuration);
  }, [
    isPaused,
    isLoading,
    toasts.length,
    showDuration,
    interval,
    showNextToast,
    clearAllTimers,
  ]);

  // ─── Initial fetch ──────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    fetchRecentWithdrawals();

    return () => {
      isMounted.current = false;
      clearAllTimers();
    };
  }, [fetchRecentWithdrawals, clearAllTimers]);

  // ─── Start rotation when ready ──────────────────
  useEffect(() => {
    if (!isLoading && toasts.length > 0 && !isPaused) {
      const initialDelay = setTimeout(() => {
        if (isMounted.current) {
          setIsVisible(true);
          startRotation();
        }
      }, 2000);

      return () => clearTimeout(initialDelay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, toasts.length]);

  // ─── Handle pause/resume ────────────────────────
  useEffect(() => {
    if (!isPaused && !isLoading && toasts.length > 0 && isVisible) {
      startRotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // ─── Format time ago ─────────────────────────────
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // ─── Loading state ──────────────────────────────
  if (isLoading || !currentToast) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-50 max-w-full sm:max-w-sm">
        <div className="bg-gradient-to-br from-[#0D1835] via-[#111C33] to-[#0D1835] rounded-2xl shadow-xl border border-white/10 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-32" />
              <div className="h-3 bg-white/10 rounded w-20 mt-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Mobile vs Desktop positioning ──────────────
  // CHANGED: Both mobile and desktop now use left positioning
  const positionClasses = isMobile
    ? 'bottom-4 left-4 right-4 max-w-full'
    : 'bottom-6 left-6 max-w-sm';

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300',
        positionClasses,
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6 pointer-events-none',
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative bg-gradient-to-br from-[#0D1835] via-[#111C33] to-[#0D1835] rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-5 overflow-hidden">
        {/* Glow effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3366FF] via-[#06B6D4] to-[#7C3AED] rounded-b-2xl transition-all duration-1000 ease-linear"
            style={{
              width: isVisible ? '100%' : '0%',
              transitionDuration: `${showDuration}ms`,
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Main content */}
          <div className="flex items-start gap-3">
            {/* Icon with pulse ring */}
            <div className="flex-shrink-0 relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#3366FF]/20 to-[#7C3AED]/20 flex items-center justify-center border border-white/10">
                <Wallet size={isMobile ? 16 : 18} className="text-[#86EFAC]" />
              </div>
              {/* Live indicator */}
              <div className="absolute -top-0.5 -right-0.5 flex items-center gap-1 bg-[#22C55E] rounded-full px-1.5 py-0.5 border border-[#0D1835]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                <span className="font-bold text-white">
                  {currentToast.displayName}
                </span>
                <span className="text-white/60 mx-1">withdrew</span>
                <span className="font-bold text-[#86EFAC]">
                  {currentToast.amount.toLocaleString()} {currentToast.currency}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Clock size={isMobile ? 8 : 10} className="text-white/40" />
                <span className="text-[10px] sm:text-xs text-white/40">
                  {formatTimeAgo(currentToast.timestamp)}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-1">
                  <Sparkles
                    size={isMobile ? 8 : 10}
                    className="text-[#FCD34D]"
                  />
                  <span className="text-[10px] sm:text-xs text-[#FCD34D] font-medium">
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors mt-0.5 p-1 touch-manipulation"
              onClick={() => {
                setIsVisible(false);
                clearAllTimers();
              }}
              aria-label="Close notification"
            >
              <X size={isMobile ? 14 : 16} />
            </button>
          </div>

          {/* Navigation controls - only on mobile */}
          {isMobile && toasts.length > 1 && (
            <div className="flex items-center justify-between mt-3 gap-2">
              <button
                onClick={showPreviousToast}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors touch-manipulation"
                aria-label="Previous withdrawal"
              >
                <ChevronLeft size={14} className="text-white/40" />
              </button>

              <div className="flex items-center gap-1.5 flex-1 justify-center">
                {toasts.slice(0, 5).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-1 rounded-full transition-all duration-500',
                      index === currentIndex % 5
                        ? 'bg-gradient-to-r from-[#3366FF] to-[#7C3AED] w-4'
                        : 'bg-white/10 w-1.5',
                    )}
                  />
                ))}
                {toasts.length > 5 && (
                  <span className="text-[10px] text-white/30 ml-1">
                    +{toasts.length - 5}
                  </span>
                )}
              </div>

              <button
                onClick={showNextToast}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors touch-manipulation"
                aria-label="Next withdrawal"
              >
                <ChevronRight size={14} className="text-white/40" />
              </button>
            </div>
          )}

          {/* Progress indicators - desktop */}
          {!isMobile && (
            <div className="flex items-center gap-1.5 mt-3">
              {toasts.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1 rounded-full transition-all duration-500',
                    index === currentIndex % 5
                      ? 'bg-gradient-to-r from-[#3366FF] to-[#7C3AED] w-4'
                      : 'bg-white/10 w-1.5',
                  )}
                />
              ))}
              {toasts.length > 5 && (
                <span className="text-[10px] text-white/30 ml-1">
                  +{toasts.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Counter */}
          <p className="text-[10px] text-white/20 text-center mt-2">
            {Math.min(currentIndex + 1, toasts.length)} of {toasts.length}{' '}
            recent withdrawals
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateDemoWithdrawals(): WithdrawalNotification[] {
  const names = [
    'Alice M.',
    'Jean N.',
    'Grace K.',
    'Patrick M.',
    'Sarah R.',
    'David M.',
    'Brigitte N.',
    'Emmanuel H.',
    'Christine U.',
    'Fidel K.',
    'Immaculée M.',
    'John D.',
    'Jane S.',
    'Robert W.',
    'Mary A.',
    'Peter O.',
    'Susan K.',
    'Michael M.',
    'Elizabeth R.',
    'William N.',
  ];

  const withdrawals: WithdrawalNotification[] = [];
  const now = new Date();

  for (let i = 0; i < 200; i++) {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - (i + 1) * 3);

    withdrawals.push({
      id: `demo-${i}`,
      displayName: names[i % names.length],
      amount: Math.floor(Math.random() * 8000) + 1000,
      currency: 'RWF',
      timestamp: date.toISOString(),
    });
  }

  return withdrawals;
}
