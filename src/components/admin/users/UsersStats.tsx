// src/components/admin/users/UsersStats.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { UserStats } from '@/app/admin/types';

interface UsersStatsProps {
  stats: UserStats;
  loading: boolean;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-lg border border-white/5 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-6 w-16 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

export function UsersStats({ stats, loading }: UsersStatsProps) {
  const statCards = [
    {
      icon: <Users className="w-4 h-4 text-blue-400" />,
      bg: 'bg-blue-500/10',
      label: 'Total Users',
      value: stats.total,
      sub: `${stats.active} active`,
    },
    {
      icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
      bg: 'bg-emerald-500/10',
      label: 'Active',
      value: stats.active,
      sub: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`,
    },
    {
      icon: <UserX className="w-4 h-4 text-red-400" />,
      bg: 'bg-red-500/10',
      label: 'Inactive',
      value: stats.inactive,
      sub: `${stats.inactive} users`,
    },
    {
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      bg: 'bg-purple-500/10',
      label: 'Admins',
      value: stats.admins,
      sub: 'Full access',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25, ease: 'easeOut' }}
          className="bg-white/5 rounded-lg border border-white/5 p-4 hover:border-white/10 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    stat.bg || 'bg-white/5',
                  )}
                >
                  <div className="text-white/60 group-hover:text-white/80 transition-colors">
                    {stat.icon}
                  </div>
                </div>
              </div>

              <div className="text-lg font-semibold text-white tracking-tight">
                {stat.value.toLocaleString()}
              </div>

              <div className="text-[10px] font-medium text-gray-500 truncate">
                {stat.label}
                {stat.sub && (
                  <span className="text-gray-500 ml-1">· {stat.sub}</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
