// src/components/admin/audit-logs/AuditLogsHeader.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { AuditLogPermissions } from '@/app/admin/types';

interface AuditLogsHeaderProps {
  permissions: AuditLogPermissions;
  refreshing: boolean;
  exporting: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

export function AuditLogsHeader({
  permissions,
  refreshing,
  exporting,
  onRefresh,
  onExport,
}: AuditLogsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button */}
        <Link
          href={ROUTES.DASHBOARD}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200 group flex items-center justify-center"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>

        <div className="min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 mb-0.5">
            <Link
              href={ROUTES.DASHBOARD}
              className="hover:text-gray-300 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-2.5 h-2.5 text-gray-700" />
            <span className="text-gray-400">Admin</span>
            <ChevronRight className="w-2.5 h-2.5 text-gray-700" />
            <span className="text-gray-400">Audit</span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Audit Logs
          </h1>

          <p className="text-[12px] text-gray-500 mt-0.5 hidden sm:block">
            Track and review system activities with detailed audit trails
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 w-full lg:w-auto">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {permissions.canExport && (
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 active:bg-blue-700 transition-all text-xs shadow-sm shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
