// src/components/admin/roles/RolesHeader.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface RolesHeaderProps {
  rolesCount: number;
}

export function RolesHeader({ rolesCount }: RolesHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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
            <span className="text-gray-400">Roles</span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Roles & Permissions
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/15 text-purple-400 text-[9px] font-medium">
              {rolesCount} Roles
            </span>
          </h1>

          <p className="text-[12px] text-gray-500 mt-0.5 hidden sm:block">
            Manage roles and their permissions
          </p>
        </div>
      </div>
    </motion.div>
  );
}
