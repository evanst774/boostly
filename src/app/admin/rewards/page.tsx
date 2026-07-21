// src/app/admin/rewards/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Users,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';

interface RewardSummary {
  id: string;
  title: string;
  type: string;
  amount: number;
  claimed: boolean;
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<RewardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, claimed: 0, pending: 0 });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const [rewardsRes, statsRes] = await Promise.all([
        fetch('/api/admin/rewards'),
        fetch('/api/admin/rewards/stats'),
      ]);
      const rewardsData = await rewardsRes.json();
      const statsData = await statsRes.json();
      setRewards(rewardsData.rewards || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Rewards
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage all rewards on the platform
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-[#F59E0B] text-[#0F172A] text-sm font-bold hover:bg-[#D97706] transition-colors flex items-center gap-2 shadow-lg shadow-gold/25">
          <Plus size={18} />
          Create Reward
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Rewards"
          value={stats.total}
          icon={<Award size={20} />}
          color="purple"
        />
        <StatCard
          label="Claimed"
          value={stats.claimed}
          icon={<Users size={20} />}
          color="green"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<DollarSign size={20} />}
          color="yellow"
        />
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="p-4 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-2xl flex-shrink-0">
                  🏆
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                    {reward.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {reward.type}
                    </span>
                    <span className="text-xs font-bold text-[#F59E0B] bg-[#FFFBEB] dark:bg-[#F59E0B]/20 px-2 py-0.5 rounded-full">
                      {formatCurrency(reward.amount)}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {reward.claimed ? '✅ Claimed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors">
                    <Edit2
                      size={16}
                      className="text-[#64748B] dark:text-[#94A3B8]"
                    />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors">
                    <Trash2 size={16} className="text-[#EF4444]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
