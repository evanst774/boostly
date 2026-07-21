// src/components/admin/roles/RoleBanner.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { roleConfig } from './configs';
import { RoleData } from '@/app/admin/types';

interface RoleBannerProps {
  selectedRole: RoleData | null;
  totalPermCount: number;
}

export function RoleBanner({ selectedRole, totalPermCount }: RoleBannerProps) {
  return (
    <AnimatePresence mode="wait">
      {selectedRole && (
        <motion.div
          key={selectedRole.id}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 touch-manipulation"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/10 flex-shrink-0">
              {roleConfig[selectedRole.name]?.icon || (
                <Users className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white font-space-grotesk">
                Editing:{' '}
                {roleConfig[selectedRole.name]?.label || selectedRole.name}
              </div>
              <div className="text-xs text-gray-500 font-space-grotesk truncate">
                {selectedRole.permissions.length} of {totalPermCount}{' '}
                permissions granted • {selectedRole.userCount || 0} users
                assigned
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
