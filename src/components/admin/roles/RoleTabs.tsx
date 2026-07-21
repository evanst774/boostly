// src/components/admin/roles/RoleTabs.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { roleConfig } from './configs';
import { RoleData } from '@/app/admin/types';
import { RoleTabsSkeleton } from './RoleTabsSkeleton';

interface RoleTabsProps {
  roles: RoleData[];
  selectedRoleId: string | null;
  totalPermCount: number;
  onSelectRole: (roleId: string) => void;
  loading?: boolean;
}

export function RoleTabs({
  roles,
  selectedRoleId,
  totalPermCount,
  onSelectRole,
  loading,
}: RoleTabsProps) {
  if (loading) {
    return <RoleTabsSkeleton />;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide touch-manipulation">
      {roles.map((role) => {
        const cfg = roleConfig[role.name] || roleConfig.DEFAULT;
        const isSelected = selectedRoleId === role.id;
        return (
          <motion.button
            key={role.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole(role.id)}
            className={cn(
              'touch-min-target flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all duration-200',
              isSelected
                ? `${cfg.borderColor} bg-gradient-to-br ${cfg.gradient} shadow-lg shadow-purple-500/10`
                : 'border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10',
            )}
            aria-label={`Select ${cfg.label} role`}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-white/10' : 'bg-white/5',
              )}
            >
              {cfg.icon}
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-bold text-white font-space-grotesk">
                {cfg.label}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] text-gray-500 font-space-grotesk">
                  {role.permissions.length}/{totalPermCount} perms
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold font-space-grotesk"
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.color}30`,
                  }}
                >
                  {role.isSystem ? 'System' : 'Custom'}
                </span>
              </div>
            </div>
            {isSelected && (
              <Check className="w-5 h-5 text-white ml-2 flex-shrink-0" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
