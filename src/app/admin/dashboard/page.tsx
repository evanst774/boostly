// src/app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  FileText,
  Award,
  Wallet,
  BarChart3,
  Settings,
  RefreshCw,
  Sparkles,
  UserCheck,
  DollarSign,
  Clock,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

// Tab Components
import { OverviewTab } from '@/components/admin/tabs/OverviewTab';
import { UsersTab } from '@/components/admin/tabs/UsersTab';
import { ContentTab } from '@/components/admin/tabs/ContentTab';
import { RewardsTab } from '@/components/admin/tabs/RewardsTab';
import { WithdrawalsTab } from '@/components/admin/tabs/WithdrawalsTab';
import { AnalyticsTab } from '@/components/admin/tabs/AnalyticsTab';
import { SettingsTab } from '@/components/admin/tabs/SettingsTab';

type AdminTab =
  | 'overview'
  | 'users'
  | 'content'
  | 'rewards'
  | 'withdrawals'
  | 'analytics'
  | 'settings';

interface DashboardData {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    growthPercent: number;
  };
  money: {
    totalPaidOut: number;
    paidOutToday: number;
    paidOutThisMonth: number;
    outstandingLiability: number;
    totalWithdrawn: number;
    pendingWithdrawalCount: number;
    pendingWithdrawalAmount: number;
  };
  content: {
    videos: { total: number; active: number };
    games: { total: number; active: number };
    surveys: { total: number; active: number };
  };
  health: {
    avgCostPerActiveUser: number;
    earningUsersToday: number;
  };
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
}

export default function AdminDashboard() {
  const { formatAmount } = useSystemCurrency();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/stats?include=series,activity');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={18} /> },
    {
      id: 'users',
      label: 'Users',
      icon: <Users size={18} />,
      badge: data?.users.newToday,
    },
    { id: 'content', label: 'Content', icon: <FileText size={18} /> },
    { id: 'rewards', label: 'Rewards', icon: <Award size={18} /> },
    {
      id: 'withdrawals',
      label: 'Withdrawals',
      icon: <Wallet size={18} />,
      badge: data?.money.pendingWithdrawalCount,
    },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-[#2563EB]/20 border-t-[#2563EB] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={20} className="text-[#2563EB] animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-outfit animate-pulse text-center">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0 font-outfit">
      {/* Header */}
      <div
        className="relative overflow-hidden p-4 sm:p-6 rounded-2xl border shadow-2xl transition-all duration-300 
        bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F5F9] 
        dark:bg-gradient-to-br dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] 
        border-[#2563EB]/30 dark:border-[#2563EB]/20 
        shadow-blue-500/20 dark:shadow-blue-500/10"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl bg-[#2563EB]/10 dark:bg-[#2563EB]/20 transition-all duration-500" />
          <div className="absolute -bottom-24 -left-24 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20 transition-all duration-500" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full blur-3xl opacity-20 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6]" />

          {/* Animated Gradient Line */}
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent"
          />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 sm:p-3 rounded-xl bg-[#2563EB]/10 dark:bg-[#2563EB]/20 transition-all duration-300 flex-shrink-0">
                <Shield
                  size={20}
                  className="text-[#2563EB] dark:text-[#60A5FA]"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold flex flex-wrap items-center gap-2">
                  <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
                    Admin Dashboard
                  </span>
                  <span
                    className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full border 
                    bg-[#2563EB]/10 dark:bg-[#2563EB]/20 
                    text-[#2563EB] dark:text-[#60A5FA] 
                    border-[#2563EB]/20 dark:border-[#2563EB]/30 whitespace-nowrap"
                  >
                    v2.0
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] transition-colors duration-300 truncate">
                  Manage your platform and users
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto"
          >
            <button
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl border transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 backdrop-blur-sm
                border-[#E2E8F0] dark:border-[#334155] 
                hover:border-[#2563EB] dark:hover:border-[#2563EB] 
                hover:bg-[#2563EB]/5 dark:hover:bg-[#2563EB]/10 
                text-[#64748B] dark:text-[#94A3B8] 
                hover:text-[#0F172A] dark:hover:text-white"
              onClick={fetchDashboardData}
            >
              <RefreshCw
                size={14}
                className={isLoading ? 'animate-spin' : ''}
              />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </motion.div>
        </div>

        {/* Quick Stats Bar - Using formatAmount from hook */}
        <div className="relative mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <QuickStat
            label="Total Users"
            value={data?.users.total.toLocaleString() || '0'}
            icon={<Users size={14} />}
            color="blue"
          />
          <QuickStat
            label="Active Users"
            value={data?.users.active.toLocaleString() || '0'}
            icon={<UserCheck size={14} />}
            color="green"
          />
          <QuickStat
            label="Today's Payout"
            value={formatAmount(data?.money.paidOutToday || 0)}
            icon={<DollarSign size={14} />}
            color="yellow"
          />
          <QuickStat
            label="Pending Withdrawals"
            value={data?.money.pendingWithdrawalCount.toLocaleString() || '0'}
            icon={<Clock size={14} />}
            color="red"
          />
        </div>
      </div>

      {/* Premium Tabs - Responsive */}
      <div className="relative">
        <div
          className="flex gap-1 rounded-2xl p-1 border overflow-x-auto shadow-lg transition-all duration-300
          bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-sm 
          border-[#E2E8F0] dark:border-[#334155] 
          shadow-[#2563EB]/10 dark:shadow-[#2563EB]/5 scrollbar-hide"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                'relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap font-outfit touch-min-target',
                activeTab === tab.id
                  ? 'text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] shadow-lg shadow-blue-500/25'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5',
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              <span className="hidden xs:inline">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] -z-10"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[300px]"
        >
          {activeTab === 'overview' && data && <OverviewTab data={data} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'content' && <ContentTab />}
          {activeTab === 'rewards' && <RewardsTab />}
          {activeTab === 'withdrawals' && <WithdrawalsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Quick Stat Component with CSS-based dark mode and responsive design
function QuickStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-[#2563EB]/10',
      border: 'border-[#2563EB]/20',
      text: 'text-[#2563EB] dark:text-[#60A5FA]',
    },
    green: {
      bg: 'bg-[#22C55E]/10',
      border: 'border-[#22C55E]/20',
      text: 'text-[#22C55E] dark:text-[#4ADE80]',
    },
    yellow: {
      bg: 'bg-[#F59E0B]/10',
      border: 'border-[#F59E0B]/20',
      text: 'text-[#F59E0B] dark:text-[#FBBF24]',
    },
    red: {
      bg: 'bg-[#EF4444]/10',
      border: 'border-[#EF4444]/20',
      text: 'text-[#EF4444] dark:text-[#F87171]',
    },
  };

  const c = colorClasses[color as keyof typeof colorClasses];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5 touch-min-target',
        c.bg,
        c.border,
      )}
    >
      <div className={cn('opacity-70 flex-shrink-0', c.text)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] transition-colors duration-300 truncate">
          {label}
        </p>
        <p className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white transition-colors duration-300 truncate">
          {value}
        </p>
      </div>
    </motion.div>
  );
}
