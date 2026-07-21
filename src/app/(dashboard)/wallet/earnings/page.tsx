// src/app/(dashboard)/wallet/earnings/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Video,
  Gamepad2,
  Gift,
  Users,
  Award,
  Sparkles,
  DollarSign,
  Flame,
  Star,
  Trophy,
} from 'lucide-react';
import { useEarningsStats } from '@/hooks/useEarningsStats';
import { cn, formatCurrency } from '@/lib/utils';

type Period = 'week' | 'month' | 'year' | 'all';

interface EarningsChartPoint {
  label: string;
  amount: number;
}

interface EarningsBreakdownItem {
  type: string;
  amount: number;
  percentage: number;
}

export default function EarningsStatsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const { data, isLoading } = useEarningsStats(period);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 border-4 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-[#6B7280]">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  // Access data directly from the EarningsStats interface
  const total = data?.total || 0;
  const change = data?.change || 0;
  const breakdown = data?.breakdown || [];
  const chartData = data?.chart || [];
  const bestDay = data?.bestDay || null;
  const averageDaily = data?.averageDaily || 0;
  const highest = data?.highest || 0;
  const streak = data?.streak || 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-xl border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Earnings Stats</h1>
          <p className="text-sm text-[#6B7280]">
            Track your earnings performance
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] p-6 text-white">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10">
          <p className="text-sm text-white/75">
            {period === 'week'
              ? 'This Week'
              : period === 'month'
                ? 'This Month'
                : period === 'year'
                  ? 'This Year'
                  : 'All Time'}
          </p>
          <p className="text-4xl font-extrabold tracking-tight mt-1">
            {formatCurrency(total)}
          </p>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full mt-2',
              change >= 0
                ? 'bg-emerald-500/30 text-emerald-300'
                : 'bg-red-500/30 text-red-300',
            )}
          >
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs last{' '}
            {period}
          </span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-2">
        {(['week', 'month', 'year', 'all'] as Period[]).map((p) => (
          <button
            key={p}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              period === p
                ? 'bg-[#2563EB] text-white'
                : 'text-[#6B7280] hover:bg-[#F8FAFC]',
            )}
            onClick={() => setPeriod(p)}
          >
            {p === 'week'
              ? 'Week'
              : p === 'month'
                ? 'Month'
                : p === 'year'
                  ? 'Year'
                  : 'All'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Earnings Overview</h3>
          <span className="text-xs text-[#6B7280]">
            {period === 'week'
              ? 'Last 7 days'
              : period === 'month'
                ? 'Last 30 days'
                : period === 'year'
                  ? 'Last 12 months'
                  : 'All time'}
          </span>
        </div>
        <div className="flex items-end gap-2 h-48">
          {chartData.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center w-full">
              No data available
            </p>
          ) : (
            chartData.map((item: EarningsChartPoint, index: number) => {
              const maxValue = Math.max(...chartData.map((d: EarningsChartPoint) => d.amount));
              const height = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;
              const isActive = index === chartData.length - 1;

              return (
                <div
                  key={item.label || index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-semibold text-[#9CA3AF]">
                    {item.amount >= 1000
                      ? (item.amount / 1000).toFixed(1) + 'k'
                      : item.amount}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer',
                      isActive ? 'bg-[#2563EB]' : 'bg-[#DBEAFE]',
                    )}
                    style={{
                      height: Math.max(height, 4) + '%',
                      minHeight: '8px',
                    }}
                  />
                  <span className="text-[10px] font-medium text-[#9CA3AF]">
                    {item.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F3F4F6]">
          <h3 className="text-sm font-bold">Earnings Breakdown</h3>
        </div>
        {breakdown.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-[#6B7280]">No earnings data available</p>
          </div>
        ) : (
          breakdown.map((item: EarningsBreakdownItem, index: number) => {
            const colors = [
              'bg-[#2563EB]',
              'bg-[#22C55E]',
              'bg-[#F59E0B]',
              'bg-[#8B5CF6]',
              'bg-[#EC4899]',
              'bg-[#06B6D4]',
            ];
            const icons = {
              video: <Video size={18} />,
              game: <Gamepad2 size={18} />,
              bonus: <Gift size={18} />,
              referral: <Users size={18} />,
              badge: <Award size={18} />,
              subscription: <Sparkles size={18} />,
            };

            return (
              <div
                key={item.type || index}
                className={cn(
                  'flex items-center gap-3 px-5 py-3',
                  index !== breakdown.length - 1 && 'border-b border-[#F3F4F6]',
                )}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-lg">
                  {icons[item.type as keyof typeof icons] || '📊'}
                </span>
                <span className="flex-1 text-sm font-medium capitalize">
                  {item.type || 'Other'}
                </span>
                <div className="w-24 h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: colors[index % colors.length],
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-right min-w-[80px]">
                  {formatCurrency(item.amount)}
                </span>
                <span className="text-xs text-[#6B7280] w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <Trophy size={18} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Best Day</p>
              <p className="text-lg font-extrabold">
                {formatCurrency(bestDay?.amount || 0)}
              </p>
              <p className="text-xs text-[#6B7280]">{bestDay?.date || '—'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
              <Flame size={18} className="text-[#22C55E]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Current Streak</p>
              <p className="text-lg font-extrabold">{streak} days</p>
              <p className="text-xs text-[#6B7280]">Keep going! 🔥</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center">
              <Star size={18} className="text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Avg. Daily</p>
              <p className="text-lg font-extrabold">
                {formatCurrency(averageDaily)}
              </p>
              <p className="text-xs text-[#6B7280]">per day</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
              <DollarSign size={18} className="text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Highest</p>
              <p className="text-lg font-extrabold">
                {formatCurrency(highest)}
              </p>
              <p className="text-xs text-[#6B7280]">single reward</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
