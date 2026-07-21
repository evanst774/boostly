// src/components/admin/tabs/OverviewTab.tsx - Add Chart.js integration
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Activity,
  ChevronRight,
  Users,
  UserCheck,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
  ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface OverviewTabProps {
  data: {
    users: {
      total: number;
      active: number;
      newToday: number;
      growthPercent: number;
    };
    money: {
      totalPaidOut: number;
      paidOutToday: number;
      paidOutThisMonth: number;
      pendingWithdrawalCount: number;
      pendingWithdrawalAmount: number;
      totalWithdrawn: number;
    };
    content: {
      videos: { total: number; active: number };
      games: { total: number; active: number };
      surveys: { total: number; active: number };
    };
    health: { earningUsersToday: number };
    payoutSeries?: Array<{ date: string; amount: number; count: number }>;
    recentActivity?: Array<{
      id: string;
      userId: string;
      userName: string | null;
      type: string;
      amount: number;
      description: string;
      createdAt: string;
    }>;
  };
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { formatAmount } = useSystemCurrency();
  const [isDark, setIsDark] = useState(false);
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const darkMode = document.documentElement.classList.contains('dark');
    setIsDark(darkMode);

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Prepare chart data
  const dates =
    data.payoutSeries?.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    }) || [];

  const amounts = data.payoutSeries?.map((item) => item.amount) || [];

  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(100, 116, 139, 0.1)';

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Revenue',
        data: amounts,
        borderColor: '#2563EB',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(
            0,
            isDark ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)',
          );
          gradient.addColorStop(
            1,
            isDark ? 'rgba(37, 99, 235, 0.0)' : 'rgba(37, 99, 235, 0.0)',
          );
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: isDark ? '#1E293B' : '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#FFFFFF' : '#0F172A',
        bodyColor: isDark ? '#94A3B8' : '#64748B',
        borderColor: isDark
          ? 'rgba(37, 99, 235, 0.2)'
          : 'rgba(37, 99, 235, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            return `${formatAmount(context.parsed.y ?? 0)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 9,
          },
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: {
            size: 9,
          },
          callback: function (value: number | string) {
            return formatAmount(Number(value));
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlowStatCard
          label="Total Users"
          value={data.users.total.toLocaleString()}
          change={`${data.users.growthPercent > 0 ? '+' : ''}${data.users.growthPercent.toFixed(1)}%`}
          changeType={data.users.growthPercent >= 0 ? 'up' : 'down'}
          icon={<Users size={20} />}
          color="blue"
          subtitle={`${data.users.newToday} new today`}
        />
        <GlowStatCard
          label="Active Users"
          value={data.users.active.toLocaleString()}
          change={`${data.users.active > 0 ? Math.round((data.users.active / data.users.total) * 100) : 0}%`}
          changeType="up"
          icon={<UserCheck size={20} />}
          color="green"
          subtitle={`${data.health.earningUsersToday} earning today`}
        />
        <GlowStatCard
          label="Monthly Revenue"
          value={formatAmount(data.money.paidOutThisMonth)}
          change={`${data.money.paidOutToday > 0 ? '+' : ''}${formatAmount(data.money.paidOutToday)} today`}
          changeType={data.money.paidOutToday > 0 ? 'up' : 'neutral'}
          icon={<DollarSign size={20} />}
          color="yellow"
          subtitle={`${formatAmount(data.money.totalPaidOut)} total`}
        />
        <GlowStatCard
          label="Pending Withdrawals"
          value={data.money.pendingWithdrawalCount.toLocaleString()}
          change={
            data.money.pendingWithdrawalCount > 0
              ? `${formatAmount(data.money.pendingWithdrawalAmount)} pending`
              : 'All processed'
          }
          changeType={data.money.pendingWithdrawalCount > 0 ? 'up' : 'neutral'}
          icon={<Wallet size={20} />}
          color="purple"
          subtitle={`${formatAmount(data.money.totalWithdrawn)} withdrawn`}
        />
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <ContentGlowCard
          icon="📺"
          label="Videos"
          value={data.content.videos.total}
          active={data.content.videos.active}
          color="blue"
        />
        <ContentGlowCard
          icon="🎮"
          label="Games"
          value={data.content.games.total}
          active={data.content.games.active}
          color="green"
        />
        <ContentGlowCard
          icon="📋"
          label="Surveys"
          value={data.content.surveys.total}
          active={data.content.surveys.active}
          color="purple"
        />
      </div>

      {/* Revenue Chart with Chart.js */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xl shadow-[#2563EB]/10 dark:shadow-[#2563EB]/5 p-4 sm:p-5 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563EB] to-transparent" />
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp
                size={18}
                className="text-[#2563EB] dark:text-[#60A5FA]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                Revenue Overview
              </h3>
              <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                Last 30 days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
              Total:{' '}
              <span className="text-[#0F172A] dark:text-white font-semibold">
                {formatAmount(data.money.totalPaidOut)}
              </span>
            </span>
            <span className="w-px h-5 sm:h-6 bg-[#E2E8F0] dark:bg-[#334155]" />
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] hidden xs:inline">
              Avg:{' '}
              <span className="text-[#2563EB] dark:text-[#60A5FA] font-semibold">
                {formatAmount(data.money.totalPaidOut / 30)}
              </span>
            </span>
          </div>
        </div>
        <div className="h-40 sm:h-48">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Activity - remains the same */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xl shadow-[#2563EB]/10 dark:shadow-[#2563EB]/5 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
              <Activity
                size={16}
                className="text-[#2563EB] dark:text-[#60A5FA]"
              />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
              Recent Activity
            </h3>
          </div>
          <button className="text-[10px] sm:text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#93C5FD] flex items-center gap-1 transition-colors">
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
          {(data.recentActivity || []).map((item, index) => (
            <div
              key={item.id || index}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/50 transition-colors group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2563EB]/10 dark:bg-[#2563EB]/10 flex items-center justify-center text-base sm:text-xl group-hover:scale-110 transition-transform flex-shrink-0">
                {item.type === 'EARN'
                  ? '💰'
                  : item.type === 'WITHDRAWAL'
                    ? '🏦'
                    : '📝'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">
                  {item.description || 'Activity'}
                </p>
                <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                  {item.userName || 'System'} ·{' '}
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              {item.amount > 0 && (
                <span className="text-sm font-bold text-[#22C55E] flex-shrink-0">
                  +{formatAmount(item.amount)}
                </span>
              )}
            </div>
          ))}
          {(!data.recentActivity || data.recentActivity.length === 0) && (
            <div className="px-4 sm:px-5 py-8 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                No recent activity
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// GlowStatCard component with CSS dark mode
interface GlowStatCardProps {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  subtitle?: string;
}

function GlowStatCard({
  label,
  value,
  change,
  changeType,
  icon,
  color,
  subtitle,
}: GlowStatCardProps) {
  const colors = {
    blue: {
      bg: 'bg-[#2563EB]/10',
      border: 'border-[#2563EB]/20',
      text: 'text-[#2563EB] dark:text-[#60A5FA]',
      iconBg: 'bg-[#2563EB]/20',
    },
    green: {
      bg: 'bg-[#22C55E]/10',
      border: 'border-[#22C55E]/20',
      text: 'text-[#22C55E] dark:text-[#4ADE80]',
      iconBg: 'bg-[#22C55E]/20',
    },
    yellow: {
      bg: 'bg-[#F59E0B]/10',
      border: 'border-[#F59E0B]/20',
      text: 'text-[#F59E0B] dark:text-[#FBBF24]',
      iconBg: 'bg-[#F59E0B]/20',
    },
    purple: {
      bg: 'bg-[#8B5CF6]/10',
      border: 'border-[#8B5CF6]/20',
      text: 'text-[#8B5CF6] dark:text-[#A78BFA]',
      iconBg: 'bg-[#8B5CF6]/20',
    },
    red: {
      bg: 'bg-[#EF4444]/10',
      border: 'border-[#EF4444]/20',
      text: 'text-[#EF4444] dark:text-[#F87171]',
      iconBg: 'bg-[#EF4444]/20',
    },
  };
  const c = colors[color as keyof typeof colors];

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white dark:bg-[#1E293B] rounded-2xl border p-4 sm:p-5 transition-all hover:scale-[1.02] hover:shadow-xl',
        c.border,
      )}
    >
      <div className="relative">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
              c.iconBg,
            )}
          >
            <span className={c.text}>{icon}</span>
          </div>
          <span
            className={cn(
              'text-[9px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full',
              changeType === 'up'
                ? 'text-[#22C55E] dark:text-[#4ADE80] bg-[#22C55E]/20'
                : changeType === 'down'
                  ? 'text-[#EF4444] dark:text-[#F87171] bg-[#EF4444]/20'
                  : 'text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155]',
            )}
          >
            {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : ''}{' '}
            {change}
          </span>
        </div>
        <p className="text-lg sm:text-2xl font-extrabold mt-2 sm:mt-3 font-outfit text-[#0F172A] dark:text-white">
          {value}
        </p>
        <p className="text-[10px] sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
          {label}
        </p>
        {subtitle && (
          <p className="text-[9px] sm:text-xs text-[#94A3B8] dark:text-[#64748B] mt-0.5 sm:mt-1">
            {subtitle}
          </p>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent opacity-50" />
      </div>
    </div>
  );
}

// ContentGlowCard with CSS dark mode
interface ContentGlowCardProps {
  icon: string;
  label: string;
  value: number;
  active: number;
  color: 'blue' | 'green' | 'purple';
}

function ContentGlowCard({
  icon,
  label,
  value,
  active,
  color,
}: ContentGlowCardProps) {
  const colors: Record<string, string> = {
    blue: 'from-[#2563EB]/20 to-[#1D4ED8]/10 border-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
    green:
      'from-[#22C55E]/20 to-[#16A34A]/10 border-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
    purple:
      'from-[#8B5CF6]/20 to-[#7C3AED]/10 border-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white dark:bg-[#1E293B] rounded-2xl border p-4 sm:p-5 text-center transition-all hover:scale-[1.02] hover:shadow-xl',
        colors[color],
      )}
    >
      <div className="relative">
        <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{icon}</div>
        <p className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white">
          {value}
        </p>
        <p className="text-[10px] sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
          Total {label}
        </p>
        <p className="text-[9px] sm:text-xs text-[#22C55E] dark:text-[#4ADE80] mt-0.5 sm:mt-1">
          {active} active
        </p>
      </div>
    </div>
  );
}
