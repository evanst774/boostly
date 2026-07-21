// src/components/wallet/WithdrawalActivity.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WithdrawalActivityItem {
  id: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  completedAt?: string;
  timeAgo: string;
  formattedAmount: string;
}

interface WithdrawalStats {
  totalWithdrawn: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  recentWithdrawals: WithdrawalActivityItem[];
}

export function WithdrawalActivity() {
  const [activities, setActivities] = useState<WithdrawalActivityItem[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'completed' | 'failed'
  >('all');

  useEffect(() => {
    fetchActivity();
  }, [filter]);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      params.append('limit', '20');

      const response = await fetch(
        `/api/wallet/withdrawals/activity?${params}`,
      );
      const data = await response.json();

      setActivities(data.activities);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch withdrawal activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} className="text-[#F59E0B]" />;
      case 'PROCESSING':
        return <Loader2 size={16} className="text-[#2563EB] animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle2 size={16} className="text-[#22C55E]" />;
      case 'FAILED':
        return <XCircle size={16} className="text-[#EF4444]" />;
      default:
        return <Clock size={16} className="text-[#6B7280]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      case 'PROCESSING':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      case 'COMPLETED':
        return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
      case 'FAILED':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      default:
        return 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#2563EB]">
              {stats.totalWithdrawn.toLocaleString()} RWF
            </p>
            <p className="text-xs text-[#6B7280]">Total Withdrawn</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#F59E0B]">
              {stats.pendingCount}
            </p>
            <p className="text-xs text-[#6B7280]">Pending</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#22C55E]">
              {stats.completedCount}
            </p>
            <p className="text-xs text-[#6B7280]">Completed</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#EF4444]">
              {stats.failedCount}
            </p>
            <p className="text-xs text-[#6B7280]">Failed</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-[#F8FAFC] rounded-xl p-1 border border-[#F3F4F6]">
          {(['all', 'pending', 'completed', 'failed'] as const).map(
            (status) => (
              <button
                key={status}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
                  filter === status
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827]',
                )}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ),
          )}
        </div>
        <button
          className="ml-auto p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
          onClick={() => fetchActivity()}
        >
          <RefreshCw size={16} className="text-[#6B7280]" />
        </button>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#F3F4F6]">
          <div className="text-4xl mb-4">🏦</div>
          <p className="text-[#6B7280] font-medium">No withdrawal activity</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Your withdrawals will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#F3F4F6] shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(activity.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {activity.formattedAmount}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    via {activity.method.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[#6B7280]">
                    {activity.timeAgo}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      getStatusColor(activity.status),
                    )}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p
                  className={cn(
                    'text-sm font-bold',
                    activity.status === 'COMPLETED'
                      ? 'text-[#22C55E]'
                      : activity.status === 'FAILED'
                        ? 'text-[#EF4444]'
                        : 'text-[#F59E0B]',
                  )}
                >
                  {activity.amount.toLocaleString()} {activity.currency}
                </p>
                {activity.completedAt && (
                  <p className="text-[10px] text-[#6B7280]">
                    {format(new Date(activity.completedAt), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
