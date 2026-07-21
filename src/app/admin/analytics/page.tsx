// src/app/admin/analytics/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Loader2,
  Activity,
  Wallet,
  PieChart,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';
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
  totalVideos: number;
  totalGames: number;
  totalSurveys: number;
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

export default function AdminAnalyticsPage() {
  const { formatAmount } = useSystemCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isDark, setIsDark] = useState(false);

  // FIX #1: pin the generic to 'line' — an untyped `useRef<ChartJS>` defaults
  // to `ChartJS<keyof ChartTypeRegistry, ...>`, a union over every chart
  // type, which `<Line ref={...} />` (which wants a ref typed specifically
  // for 'line') rejects.
  const chartRef = useRef<ChartJS<'line', number[], string>>(null);

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

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
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
  };

  const handleExport = useCallback(() => {
    if (!data) return;
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

  const tooltipBase = {
    backgroundColor: isDark
      ? 'rgba(15, 23, 42, 0.95)'
      : 'rgba(255, 255, 255, 0.95)',
    titleColor: isDark ? '#FFFFFF' : '#0F172A',
    bodyColor: isDark ? '#94A3B8' : '#64748B',
    borderColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
  } as const;

  const revenueChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Revenue',
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
    labels: ['Videos', 'Games', 'Surveys', 'Rewards'],
    datasets: [
      {
        data: [
          data.totalVideos || 0,
          data.totalGames || 0,
          data.totalSurveys || 0,
          data.totalRevenue || 0,
        ],
        backgroundColor: ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B'],
        borderColor: isDark ? '#1E293B' : '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  // Line chart: currency-formatted tooltip and y-axis, since this plots
  // amounts.
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          // FIX #3: `context.parsed.y` is typed `number | null` — coalesce
          // before handing it to formatAmount, which only accepts number.
          label: (context: TooltipItem<'line'>) =>
            formatAmount(context.parsed.y ?? 0),
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
          callback: function (value) {
            return formatAmount(value as number);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // FIX #2: built independently rather than spreading `chartOptions` — that
  // spread carried over the line chart's `TooltipItem<'line'>`-typed
  // callback into a `ChartOptions<'bar'>` value, which chart.js's types
  // reject. It also meant the activity (count) chart's tooltip was calling
  // formatAmount() on a plain count and prefixing it with a currency symbol
  // — a real bug the type error was catching, not just noise. This chart
  // plots activity counts, so its tooltip/axis stay unformatted numbers.
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
        ...tooltipBase,
        callbacks: {
          label: (context: TooltipItem<'bar'>) =>
            `${context.parsed.y ?? 0} activities`,
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
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
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
    },
    {
      label: 'Monthly Revenue',
      value: formatAmount(data.monthlyRevenue || 0),
      change: '+12.3%',
      trend: 'up',
      icon: <TrendingUp size={18} />,
    },
    {
      label: 'Total Withdrawals',
      value: formatAmount(data.totalWithdrawals || 0),
      change: '-5.2%',
      trend: 'down',
      icon: <Wallet size={18} />,
    },
    {
      label: 'Active Users',
      value: data.activeUsers?.toLocaleString() || '0',
      change: '+8.1%',
      trend: 'up',
      icon: <Users size={18} />,
    },
  ];

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Analytics
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Platform analytics and insights
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={
              stat.trend === 'up'
                ? 'green'
                : stat.trend === 'down'
                  ? 'red'
                  : 'blue'
            }
            className="transition-all hover:shadow-md"
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
                <BarChart3
                  size={16}
                  className="text-[#2563EB] dark:text-[#60A5FA]"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Revenue Overview
                </h3>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                  {timeRange === '7d'
                    ? 'Last 7 days'
                    : timeRange === '30d'
                      ? 'Last 30 days'
                      : 'Last 90 days'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Total:{' '}
                <span className="font-semibold text-[#0F172A] dark:text-white">
                  {formatAmount(amounts.reduce((a, b) => a + b, 0))}
                </span>
              </span>
            </div>
          </div>
          <div className="h-64">
            <Line
              ref={chartRef}
              data={revenueChartData}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5">
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
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Total:{' '}
                <span className="font-semibold text-[#0F172A] dark:text-white">
                  {counts.reduce((a, b) => a + b, 0)}
                </span>
              </span>
            </div>
          </div>
          <div className="h-64">
            <Bar data={activityChartData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 flex items-center justify-center">
              <PieChart
                size={16}
                className="text-[#F59E0B] dark:text-[#FBBF24]"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                Content Distribution
              </h3>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                By content type
              </p>
            </div>
          </div>
          <div className="h-64">
            <Doughnut data={distributionData} options={doughnutOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
                <Clock
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
