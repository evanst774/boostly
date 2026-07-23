// src/components/landing/Hero.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Bell, TrendingUp, Zap } from 'lucide-react';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

// ─── Custom SVG Icons ──────────────────────────────

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <polygon points="10 8 16 12 10 16" fill="currentColor" />
  </svg>
);

const GameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <rect
      x="2"
      y="6"
      width="20"
      height="12"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
    <circle cx="16" cy="12" r="1.5" fill="currentColor" />
    <rect x="10" y="8" width="4" height="8" rx="1" fill="currentColor" />
    <circle cx="12" cy="10" r="1" fill="white" />
    <circle cx="12" cy="14" r="1" fill="white" />
  </svg>
);

const SurveyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line
      x1="7"
      y1="8"
      x2="17"
      y2="8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="7"
      y1="12"
      x2="14"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="7"
      y1="16"
      x2="11"
      y2="16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const BonusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <polygon
      points="12 4 14.5 9.5 20 10.5 16 14.5 17 20 12 17 7 20 8 14.5 4 10.5 9.5 9.5"
      fill="currentColor"
    />
  </svg>
);

const SafeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-success">
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M7 11V7a5 5 0 0110 0v4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

const InstantIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-success">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <polyline
      points="12 6 12 12 16 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-success">
    <path
      d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M23 21v-2a4 4 0 00-3-3.87"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16 3.13a4 4 0 010 7.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Skeleton Components ──────────────────────────

function BalanceSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary/50 to-primary-dark/50 rounded-2xl p-4 text-white mb-3 animate-pulse">
      <div className="h-3 w-20 bg-white/20 rounded mb-2" />
      <div className="h-8 w-32 bg-white/20 rounded" />
      <div className="flex items-center gap-3 mt-2">
        <div className="h-6 w-16 bg-white/20 rounded-full" />
        <div className="h-3 w-24 bg-white/20 rounded" />
      </div>
    </div>
  );
}

function StreakSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gold/10 to-amber-500/10 border border-gold/20 rounded-xl p-3 animate-pulse">
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full bg-gray-200" />
        ))}
      </div>
      <div className="h-3 w-40 bg-gray-200 rounded mt-1" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 border border-white/5">
      <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
      <div className="h-2 w-10 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

// ─── Activity Card Component ──────────────────────

function ActivityCard({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
    >
      <div
        className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white`}
      >
        <Icon />
      </div>
      <span className="text-[9px] text-white/60 font-medium">{label}</span>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────

export function Hero() {
  const {
    currency,
    formatAmount,
    isLoading: currencyLoading,
  } = useSystemCurrency();
  const [mounted, setMounted] = useState(false);
  const [convertedBalance, setConvertedBalance] = useState<number | null>(null);
  const [convertedStreakReward, setConvertedStreakReward] = useState<
    number | null
  >(null);
  const [isConverting, setIsConverting] = useState(true);
  const [sampleBalance] = useState(124.5);
  const [streakDays] = useState(5);
  const [totalDays] = useState(7);
  const [streakRewardUSD] = useState(150);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert USD amounts to system currency
  useEffect(() => {
    const convertAmounts = async () => {
      if (!mounted || currencyLoading || !currency) {
        return;
      }

      try {
        setIsConverting(true);

        // Convert balance and streak reward from USD to system currency
        const [balanceResult, rewardResult] = await Promise.all([
          fetch(
            `/api/public/convert-currency?amount=${sampleBalance}&from=USD&to=${currency.code}`,
          ).then((res) => res.json()),
          fetch(
            `/api/public/convert-currency?amount=${streakRewardUSD}&from=USD&to=${currency.code}`,
          ).then((res) => res.json()),
        ]);

        setConvertedBalance(balanceResult.amount);
        setConvertedStreakReward(rewardResult.amount);
      } catch (error) {
        console.error('Failed to convert currency:', error);
        // Fallback: use the USD amount with system symbol
        setConvertedBalance(sampleBalance);
        setConvertedStreakReward(streakRewardUSD);
      } finally {
        setIsConverting(false);
      }
    };

    convertAmounts();
  }, [currency, currencyLoading, mounted, sampleBalance, streakRewardUSD]);

  // Determine if we should show loading state
  const showLoading = currencyLoading || isConverting || !mounted;

  // Format balance with system currency
  const formattedBalance = showLoading
    ? null
    : formatAmount(convertedBalance || sampleBalance);

  const formattedStreakReward = showLoading
    ? null
    : formatAmount(convertedStreakReward || streakRewardUSD);

  // Determine streak progress
  const isStreakComplete = streakDays >= totalDays;
  const remainingDays = totalDays - streakDays;

  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-navy via-navy-light to-navy overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-purple/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-1.5 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary-light uppercase tracking-wider">
                #1 Rewards Platform
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-4">
              Earn Rewards.
              <br />
              <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
                Get Paid.
              </span>
              <br />
              <span className="text-white/80">Every Day.</span>
            </h1>

            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-md leading-relaxed">
              Boostly rewards you for doing what you love. Watch videos, play
              games, complete surveys, and earn real rewards. Simple, fun, and
              rewarding.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-3.5 rounded-full transition-all shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:scale-105"
              >
                Start Earning Now <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center gap-2 border border-white/20 text-white font-medium px-6 py-3.5 rounded-full hover:bg-white/10 transition-all hover:border-white/40">
                <Play className="w-4 h-4" /> How It Works
              </button>
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-5 text-white/60 text-sm"
            >
              <span className="flex items-center gap-2">
                <SafeIcon /> 100% Secure
              </span>
              <span className="flex items-center gap-2">
                <InstantIcon /> Instant Payouts
              </span>
              <span className="flex items-center gap-2">
                <UsersIcon /> Trusted by 500K+ Users
              </span>
            </motion.div>
          </motion.div>

          {/* Right Content - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="relative flex justify-center"
          >
            {/* Phone Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full bg-gold/10 blur-3xl" />
            </div>

            {/* Phone Frame */}
            <div className="relative w-[280px] sm:w-[300px] bg-white rounded-[2.5rem] shadow-2xl p-3 border-[6px] border-gray-200/10">
              <div className="bg-gray-50 rounded-[1.8rem] overflow-hidden">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-navy">
                        Hello, John! 👋
                      </p>
                      <p className="text-[10px] text-gray-400">Welcome back</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Balance Card */}
                  {showLoading ? (
                    <BalanceSkeleton />
                  ) : (
                    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-4 text-white mb-3">
                      <p className="text-[10px] opacity-75 font-medium">
                        Total Balance
                      </p>
                      <p className="text-2xl font-black tracking-tight">
                        {formattedBalance}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button className="bg-white/20 backdrop-blur text-white text-[10px] font-semibold px-3 py-1.5 rounded-full hover:bg-white/30 transition">
                          Withdraw
                        </button>
                        <span className="text-[10px] opacity-60 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +12% this week
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {showLoading ? (
                      <>
                        <ActivitySkeleton />
                        <ActivitySkeleton />
                        <ActivitySkeleton />
                        <ActivitySkeleton />
                      </>
                    ) : (
                      <>
                        <ActivityCard
                          icon={VideoIcon}
                          label="Videos"
                          color="bg-primary"
                        />
                        <ActivityCard
                          icon={GameIcon}
                          label="Games"
                          color="bg-emerald-500"
                        />
                        <ActivityCard
                          icon={SurveyIcon}
                          label="Surveys"
                          color="bg-amber-500"
                        />
                        <ActivityCard
                          icon={BonusIcon}
                          label="Bonus"
                          color="bg-pink-500"
                        />
                      </>
                    )}
                  </div>

                  {/* Streak Card */}
                  {showLoading ? (
                    <StreakSkeleton />
                  ) : (
                    <div className="bg-gradient-to-r from-gold/10 to-amber-500/10 border border-gold/20 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-semibold text-navy flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-gold" />
                          Daily Streak
                        </p>
                        <span className="text-[10px] font-bold text-gold">
                          Day {streakDays} 🔥
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: totalDays }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 h-1.5 rounded-full ${
                              idx < streakDays ? 'bg-gold' : 'bg-gray-200'
                            }`}
                            style={{ width: '100%' }}
                          />
                        ))}
                      </div>
                      <p className="text-[8px] text-gray-400 mt-1">
                        {isStreakComplete
                          ? `🎉 Streak complete! Claim your ${formattedStreakReward} bonus!`
                          : `Complete ${remainingDays} more day${remainingDays > 1 ? 's' : ''} for ${formattedStreakReward} bonus`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-200/20 rounded-b-xl" />
            </div>

            {/* Floating Labels */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="absolute -top-2 -right-4 bg-gold rounded-xl p-2 shadow-lg shadow-gold/30"
            >
              <span className="text-lg">💰</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="absolute bottom-12 -left-6 bg-primary/90 backdrop-blur text-white rounded-xl p-2 shadow-lg shadow-primary/30"
            >
              <span className="text-lg">🎬</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="absolute top-1/3 -right-6 bg-purple-500/90 backdrop-blur text-white rounded-xl p-2 shadow-lg shadow-purple-500/30"
            >
              <span className="text-lg">🎮</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
