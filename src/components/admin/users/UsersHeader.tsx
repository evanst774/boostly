// src/components/admin/users/UsersHeader.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

interface UsersHeaderProps {
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function UsersHeader({
  showFilters,
  onToggleFilters,
}: UsersHeaderProps) {
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
            <span className="text-gray-400">Users</span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Users
          </h1>

          <p className="text-[12px] text-gray-500 mt-0.5 hidden sm:block">
            Manage system users, roles and access permissions
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 w-full lg:w-auto">
        <button
          onClick={onToggleFilters}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium',
            showFilters
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </button>

        <Link
          href="/admin/users/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 active:bg-blue-700 transition-all text-xs shadow-sm shadow-blue-500/20"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add User</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>
    </motion.div>
  );
}
