// src/components/admin/users/detail/UserDetailSelfViewNotice.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export function UserDetailSelfViewNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10"
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-amber-400/80">
          <span className="font-medium text-amber-400">
            Viewing your own account
          </span>
          <span className="hidden sm:inline">
            {' '}
            - Use the{' '}
            <Link
              href="/settings/profile"
              className="text-amber-400 font-medium hover:text-amber-300 transition-colors underline-offset-2 hover:underline"
            >
              profile settings
            </Link>{' '}
            to edit your details.
          </span>
        </p>
      </div>
    </motion.div>
  );
}
