// src/components/admin/tabs/AnalyticsTab.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Loader2,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Wallet,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  ChartOptions,
  TooltipItem,
  ScriptableContext,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
);

interface AnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalUsers: number;
  activeUsers: number;
  payoutSeries: Array<{ date: string; amount: number; count: number }>;
  recentActivity?: Array<{
    id: string;
    userId: string;
    userName: string | null;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export function AnalyticsTab() {
  const { currency, formatAmount } = useSystemCurrency();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isDark, setIsDark] = useState(false);
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Dark mode detection effect
  useEffect(() => {
    // Check if dark mode is enabled
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

  // Fetch analytics function - wrapped in useCallback with timeRange dependency
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Fetch analytics when timeRange changes - now includes fetchAnalytics in dependencies
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#2563EB]" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-outfit text-center">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
          No analytics data available
        </p>
      </div>
    );
  }

  // Prepare chart data
  const dates =
    data.payoutSeries?.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    }) || [];

  const amounts = data.payoutSeries?.map((item) => item.amount) || [];
  const counts = data.payoutSeries?.map((item) => item.count) || [];

  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(100, 116, 139, 0.1)';

  const revenueChartData = {
    labels: dates,
    datasets: [
      {
        label: `Revenue (${currency.code})`,
        data: amounts,
        borderColor: '#2563EB',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
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
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const activityChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Activities',
        data: counts,
        backgroundColor: isDark
          ? 'rgba(139, 92, 246, 0.6)'
          : 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8B5CF6',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const distributionData = {
    labels: ['Videos', 'Games', 'Surveys', 'Referrals', 'Bonuses'],
    datasets: [
      {
        data: [35, 25, 20, 12, 8],
        backgroundColor: [
          '#2563EB',
          '#22C55E',
          '#8B5CF6',
          '#F59E0B',
          '#EC4899',
        ],
        borderColor: isDark ? '#1E293B' : '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  const tooltipStyle = {
    backgroundColor: isDark
      ? 'rgba(15, 23, 42, 0.95)'
      : 'rgba(255, 255, 255, 0.95)',
    titleColor: isDark ? '#FFFFFF' : '#0F172A',
    bodyColor: isDark ? '#94A3B8' : '#64748B',
    borderColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
  };

  const scalesConfig = {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: textColor,
        font: {
          size: 10,
        },
        maxTicksLimit: 10,
      },
    },
    y: {
      grid: {
        color: gridColor,
      },
      ticks: {
        color: textColor,
        font: {
          size: 10,
        },
        callback: function (value: number | string) {
          return formatAmount(Number(value));
        },
      },
    },
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            return `${formatAmount(context.parsed.y ?? 0)}`;
          },
        },
      },
    },
    scales: scalesConfig,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: textColor,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            return `${formatAmount(context.parsed.y ?? 0)}`;
          },
        },
      },
    },
    scales: scalesConfig,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          font: {
            size: 10,
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
    cutout: '70%',
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: formatAmount(data.totalRevenue || 0),
      change: '+18.5%',
      trend: 'up',
      icon: <DollarSign size={18} />,
      color: 'text-[#22C55E] dark:text-[#4ADE80]',
      bg: 'bg-[#F0FDF4] dark:bg-[#22C55E]/20',
    },
    {
      label: 'Monthly Revenue',
      value: formatAmount(data.monthlyRevenue || 0),
      change: '+12.3%',
      trend: 'up',
      icon: <TrendingUp size={18} />,
      color: 'text-[#2563EB] dark:text-[#60A5FA]',
      bg: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20',
    },
    {
      label: 'Total Withdrawals',
      value: formatAmount(data.totalWithdrawals || 0),
      change: '-5.2%',
      trend: 'down',
      icon: <Wallet size={18} />,
      color: 'text-[#EF4444] dark:text-[#F87171]',
      bg: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20',
    },
    {
      label: 'Active Users',
      value: data.activeUsers?.toLocaleString() || '0',
      change: '+8.1%',
      trend: 'up',
      icon: <Users size={18} />,
      color: 'text-[#8B5CF6] dark:text-[#A78BFA]',
      bg: 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20',
    },
  ];

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Platform performance and insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl p-1 border border-[#F1F5F9] dark:border-[#334155]">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-min-target',
                  timeRange === range
                    ? 'bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white',
                )}
              >
                {range === '7d'
                  ? '7 Days'
                  : range === '30d'
                    ? '30 Days'
                    : '90 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg border border-[#F1F5F9] dark:border-[#334155] text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors flex items-center gap-1.5 touch-min-target"
          >
            <Download size={14} />
            <span className="hidden xs:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-3 sm:p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center',
                  stat.bg,
                )}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-semibold flex items-center gap-0.5',
                  stat.trend === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]',
                )}
              >
                {stat.trend === 'up' ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold mt-2 text-[#0F172A] dark:text-white">
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
                <BarChart3
                  size={16}
                  className="text-[#2563EB] dark:text-[#60A5FA]"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Revenue Overview
                </h3>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {timeRange === '7d'
                    ? 'Last 7 days'
                    : timeRange === '30d'
                      ? 'Last 30 days'
                      : 'Last 90 days'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
                Total:{' '}
                <span className="font-semibold text-[#0F172A] dark:text-white">
                  {formatAmount(amounts.reduce((a, b) => a + b, 0))}
                </span>
              </span>
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <Line
              ref={chartRef}
              data={revenueChartData}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20 flex items-center justify-center">
                <Activity
                  size={16}
                  className="text-[#8B5CF6] dark:text-[#A78BFA]"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Activity Volume
                </h3>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                  Total activities over time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
                Total:{' '}
                <span className="font-semibold text-[#0F172A] dark:text-white">
                  {counts.reduce((a, b) => a + b, 0)}
                </span>
              </span>
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <Bar data={activityChartData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Distribution Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 flex items-center justify-center">
              <PieChart
                size={16}
                className="text-[#F59E0B] dark:text-[#FBBF24]"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                Revenue Distribution
              </h3>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                By activity type
              </p>
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <Doughnut data={distributionData} options={doughnutOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
                <Activity
                  size={16}
                  className="text-[#2563EB] dark:text-[#60A5FA]"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Recent Activity
                </h3>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                  Latest platform activities
                </p>
              </div>
            </div>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
              {data.recentActivity?.length || 0} activities
            </span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
            {data.recentActivity?.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0',
                    activity.type === 'CREDIT'
                      ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E]'
                      : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444]',
                  )}
                >
                  {activity.type === 'CREDIT' ? '💰' : '💸'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">
                    {activity.description}
                  </p>
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                    <span className="truncate">
                      {activity.userName || 'System'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#64748B] flex-shrink-0" />
                    <span className="truncate">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold flex-shrink-0',
                    activity.type === 'CREDIT'
                      ? 'text-[#22C55E]'
                      : 'text-[#EF4444]',
                  )}
                >
                  {activity.type === 'CREDIT' ? '+' : '-'}
                  {formatAmount(activity.amount)}
                </span>
              </div>
            ))}
            {(!data.recentActivity || data.recentActivity.length === 0) && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  No recent activity
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
