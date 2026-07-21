// src/components/admin/tabs/RewardsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Award, Loader2, Users, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface RewardSummary {
  id: string;
  description: string;
  type: string;
  amount: number;
  createdAt: string;
}

export function RewardsTab() {
  const [stats, setStats] = useState({ total: 0, claimed: 0, pending: 0 });
  const [rewards, setRewards] = useState<RewardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/rewards');
      const data = await response.json();
      setStats(data.stats || { total: 0, claimed: 0, pending: 0 });
      setRewards(data.rewards || []);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
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
        <div className="px-5 py-4 border-b border-[#F1F5F9] dark:border-[#334155]">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
            Recent Rewards
          </h3>
        </div>
        <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-xl flex-shrink-0">
                🏆
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  {reward.description}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {reward.type} · {new Date(reward.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="text-sm font-bold text-[#22C55E]">
                +{formatCurrency(reward.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
    green:
      'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
    yellow:
      'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]',
    purple:
      'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]',
    red: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            colors[color],
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold text-[#0F172A] dark:text-white">
            {value}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</p>
        </div>
      </div>
    </div>
  );
}
