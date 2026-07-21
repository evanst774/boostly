// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Gamepad2,
  Gift,
  Users,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Flame,
  Coins,
  Calendar,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Crown,
  Rocket,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

// Components
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickAction } from '@/components/dashboard/QuickAction';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { EarningsChart } from '@/components/dashboard/EarningsChart';

const quickActions = [
  {
    icon: <Video size={18} />,
    label: 'Watch Videos',
    color: 'from-[#2563EB] to-[#1D4ED8]',
    href: '/earn/videos',
  },
  {
    icon: <Gamepad2 size={18} />,
    label: 'Play Games',
    color: 'from-[#22C55E] to-[#16A34A]',
    href: '/earn/games',
  },
  {
    icon: <Gift size={18} />,
    label: 'Daily Bonus',
    color: 'from-[#F59E0B] to-[#D97706]',
    href: '/daily-bonus',
  },
  {
    icon: <Users size={18} />,
    label: 'Refer Friends',
    color: 'from-[#8B5CF6] to-[#7C3AED]',
    href: '/referrals',
  },
];

// ─── Skeleton primitives ──────────────────────────────────────────
function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-6 lg:pb-0 font-outfit touch-manipulation">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-6 w-40" />
        </div>
        <SkeletonBlock className="hidden sm:block h-10 w-28" />
      </div>
      <SkeletonBlock className="h-[140px] sm:h-[120px] w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <SkeletonBlock className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonBlock className="h-60 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <SkeletonBlock className="h-56 w-full rounded-xl" />
    </div>
  );
}

// ✅ PWA-ready formatted currency with proper spacing
function formatCurrencyWithSpace(
  amount: number,
  formatAmount: (amount: number) => string,
): string {
  const formatted = formatAmount(amount);
  // Add a non-breaking space between number and currency symbol
  return formatted.replace(/([0-9,.])([A-Za-z])/, '$1\u00A0$2');
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();
  const { formatAmount } = useSystemCurrency();

  const [greeting, setGreeting] = useState('Good morning');
  const [balanceHidden, setBalanceHidden] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats || {
    balance: 0,
    todayEarnings: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    streak: 0,
    videoEarnings: 0,
    gameEarnings: 0,
    bonusEarnings: 0,
    referralEarnings: 0,
  };

  const recentTransactions = data?.transactions || [];

  return (
    <div className="space-y-5 pb-2 lg:pb-0 font-outfit touch-manipulation safe-top">
      {/* Greeting with Boostly theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
              {greeting}
            </p>
            <span className="text-sm">👋</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white truncate">
            Hello, {user?.name || 'User'}
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 hidden sm:block">
            Complete tasks and earn real rewards today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Boostly Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/25 touch-min-target">
            <Sparkles size={14} className="text-[#FBBF24]" />
            <span className="text-xs font-bold">Boostly Pro</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/settings/profile')}
            className="hidden sm:flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-lg px-3 py-1.5 hover:border-[#2563EB] transition-colors flex-shrink-0 shadow-sm touch-min-target"
          >
            <div className="text-left">
              <p className="text-[9px] font-medium text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
                Plan
              </p>
              <p className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center gap-1">
                <Crown size={12} className="text-[#F59E0B]" />
                {user?.plan || 'Starter'}
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-[#94A3B8] dark:text-[#64748B]"
            />
          </button>
        </div>
      </div>

      {/* Balance Card - Enhanced with Boostly theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#2563EB] p-5 sm:p-6 text-white shadow-xl shadow-blue-900/20">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#60A5FA]/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full bg-[#3B82F6]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#2563EB]/5 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBalanceHidden((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-white/75 hover:text-white transition-colors touch-min-target"
              >
                Total Balance
                {balanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <span className="text-[10px] font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                {user?.badge || 'Silver'}
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums mt-1 break-all">
              {balanceHidden
                ? '••••••'
                : formatCurrencyWithSpace(stats.balance, formatAmount)}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/30 text-emerald-200 px-2.5 py-1 rounded-full">
                <ArrowUpRight size={12} />+
                {formatCurrencyWithSpace(stats.todayEarnings, formatAmount)}{' '}
                today
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#F59E0B]/20 text-[#FBBF24] px-2.5 py-1 rounded-full">
                <Zap size={12} /> {stats.streak} day streak
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
            <div className="text-left sm:text-center">
              <p className="text-[10px] text-white/70">Total Earned</p>
              <p className="text-base sm:text-lg font-bold tabular-nums">
                {formatCurrencyWithSpace(stats.totalEarnings, formatAmount)}
              </p>
            </div>
            <div className="text-left sm:text-center">
              <p className="text-[10px] text-white/70">Withdrawn</p>
              <p className="text-base sm:text-lg font-bold tabular-nums">
                {formatCurrencyWithSpace(
                  stats.totalEarnings - stats.balance,
                  formatAmount,
                )}
              </p>
            </div>
            <button
              type="button"
              className="bg-white text-[#1E3A8A] text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-1.5 touch-min-target"
              onClick={() => router.push('/wallet/withdraw')}
            >
              <Rocket size={14} />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row - With Boostly theme */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<Coins size={16} />}
          value={formatCurrencyWithSpace(stats.todayEarnings, formatAmount)}
          label="Today"
          change="+12%"
          changeType="up"
          iconBg="bg-[#EFF6FF] dark:bg-[#2563EB]/15"
          iconColor="text-[#2563EB] dark:text-[#60A5FA]"
        />
        <StatsCard
          icon={<Calendar size={16} />}
          value={formatCurrencyWithSpace(stats.monthlyEarnings, formatAmount)}
          label="This Month"
          change="+18.5%"
          changeType="up"
          iconBg="bg-[#F0FDF4] dark:bg-[#22C55E]/15"
          iconColor="text-[#22C55E] dark:text-[#4ADE80]"
        />
        <StatsCard
          icon={<TrendingUp size={16} />}
          value={formatCurrencyWithSpace(stats.totalEarnings, formatAmount)}
          label="All Time"
          change="+5.2%"
          changeType="up"
          iconBg="bg-[#FFFBEB] dark:bg-[#F59E0B]/15"
          iconColor="text-[#F59E0B] dark:text-[#FBBF24]"
        />
        <StatsCard
          icon={<Flame size={16} />}
          value={`${stats.streak}d`}
          label="Streak"
          change="🔥"
          changeType="up"
          iconBg="bg-[#F5F3FF] dark:bg-[#8B5CF6]/15"
          iconColor="text-[#8B5CF6] dark:text-[#A78BFA]"
          className="border-[#8B5CF6]/20 dark:border-[#8B5CF6]/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <QuickAction
            key={action.label}
            icon={action.icon}
            label={action.label}
            color={action.color}
            onClick={() => router.push(action.href)}
          />
        ))}
      </div>

      {/* Streak Card - Enhanced with Boostly theme */}
      <StreakCard streak={stats.streak} />

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Earnings Chart - Boostly themed */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]">
                <TrendingUp size={14} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                Earnings Overview
              </h3>
            </div>
            <select
              className="text-[10px] border border-[#F1F5F9] dark:border-[#334155] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white flex-shrink-0 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 outline-none transition-all touch-min-target"
              defaultValue="week"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <EarningsChart data={data?.chartData} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            icon={<Video size={16} />}
            value={formatCurrencyWithSpace(stats.videoEarnings, formatAmount)}
            label="Video Rewards"
            change="+180 RWF"
            changeType="up"
            iconBg="bg-[#EFF6FF] dark:bg-[#2563EB]/15"
            iconColor="text-[#2563EB] dark:text-[#60A5FA]"
            onClick={() => router.push('/earn/videos')}
            className="hover:border-[#2563EB] transition-all"
          />
          <StatsCard
            icon={<Gamepad2 size={16} />}
            value={formatCurrencyWithSpace(stats.gameEarnings, formatAmount)}
            label="Game Rewards"
            change="+140 RWF"
            changeType="up"
            iconBg="bg-[#F0FDF4] dark:bg-[#22C55E]/15"
            iconColor="text-[#22C55E] dark:text-[#4ADE80]"
            onClick={() => router.push('/earn/games')}
            className="hover:border-[#22C55E] transition-all"
          />
          <StatsCard
            icon={<Gift size={16} />}
            value={formatCurrencyWithSpace(stats.bonusEarnings, formatAmount)}
            label="Daily Bonus"
            change="7 days"
            changeType="up"
            iconBg="bg-[#FFFBEB] dark:bg-[#F59E0B]/15"
            iconColor="text-[#F59E0B] dark:text-[#FBBF24]"
            onClick={() => router.push('/daily-bonus')}
            className="hover:border-[#F59E0B] transition-all"
          />
          <StatsCard
            icon={<Users size={16} />}
            value={formatCurrencyWithSpace(
              stats.referralEarnings,
              formatAmount,
            )}
            label="Referrals"
            change="3 new"
            changeType="up"
            iconBg="bg-[#F5F3FF] dark:bg-[#8B5CF6]/15"
            iconColor="text-[#8B5CF6] dark:text-[#A78BFA]"
            onClick={() => router.push('/referrals')}
            className="hover:border-[#8B5CF6] transition-all"
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]">
              <Award size={14} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0F172A] dark:text-white">
              Recent Activity
            </h3>
          </div>
          <button
            type="button"
            className="text-[10px] font-semibold text-[#2563EB] dark:text-[#60A5FA] flex items-center gap-0.5 hover:gap-1.5 transition-all touch-min-target"
            onClick={() => router.push('/wallet/history')}
          >
            View all
            <ChevronRight size={12} />
          </button>
        </div>
        <TransactionList transactions={recentTransactions} />
      </div>
    </div>
  );
}
