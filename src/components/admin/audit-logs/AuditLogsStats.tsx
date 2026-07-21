// src/components/admin/audit-logs/AuditLogsStats.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Edit, Trash2, DollarSign, Package } from 'lucide-react';
import { AuditStats } from '@/app/admin/types';

interface AuditLogsStatsProps {
  stats: AuditStats;
  loading: boolean;
}

function StatCardSkeleton() {
  return (
    <div className="relative bg-gradient-to-br from-white/5 to-white/2 rounded-2xl border border-white/10 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-8 w-20 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

export function AuditLogsStats({ stats, loading }: AuditLogsStatsProps) {
  const statCards = [
    {
      icon: <Edit className="w-5 h-5 text-blue-400" />,
      gradient: 'from-blue-500/20 to-blue-600/20',
      iconBg: 'bg-blue-500/20',
      label: 'Edits',
      value: stats.edits,
    },
    {
      icon: <Trash2 className="w-5 h-5 text-red-400" />,
      gradient: 'from-red-500/20 to-rose-500/20',
      iconBg: 'bg-red-500/20',
      label: 'Deletes',
      value: stats.deletes,
    },
    {
      icon: <DollarSign className="w-5 h-5 text-green-400" />,
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconBg: 'bg-green-500/20',
      label: 'Payments',
      value: stats.payments,
    },
    {
      icon: <Package className="w-5 h-5 text-purple-400" />,
      gradient: 'from-purple-500/20 to-indigo-500/20',
      iconBg: 'bg-purple-500/20',
      label: 'Inventory',
      value: stats.inventory,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          className="relative bg-gradient-to-br from-white/5 to-white/2 rounded-2xl border border-white/10 p-5 hover:border-blue-500/30 transition-all group overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                stat.gradient,
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  stat.iconBg,
                )}
              >
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {stat.label}
              </div>
              <div className="text-2xl font-bold text-white">
                {stat.value.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
