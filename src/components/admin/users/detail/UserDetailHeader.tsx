// src/components/admin/users/detail/UserDetailHeader.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Edit, Settings, UserCog } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface UserDetailHeaderProps {
  userId: string;
  userName: string;
  isSelfView: boolean;
}

export function UserDetailHeader({
  userId,
  userName,
  isSelfView,
}: UserDetailHeaderProps) {
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
          href={ROUTES.ADMIN.USERS}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200 group flex items-center justify-center"
          aria-label="Go back to users list"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>

        <div className="min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 mb-0.5">
            <Link
              href={ROUTES.ADMIN.USERS}
              className="hover:text-gray-300 transition-colors"
            >
              Users
            </Link>
            <ChevronRight className="w-2.5 h-2.5 text-gray-700" />
            <span className="text-gray-400">Details</span>
            {isSelfView && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-400 text-[9px] font-medium">
                <UserCog className="w-2.5 h-2.5" />
                You
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {userName}
          </h1>
        </div>
      </div>

      {/* Right Section */}
      {isSelfView ? (
        <Link
          href="/settings/profile"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 active:bg-blue-700 transition-all text-xs shadow-sm shadow-blue-500/20"
          aria-label="Go to profile settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Profile</span>
          <span className="sm:hidden">Profile</span>
        </Link>
      ) : (
        <Link
          href={`/admin/users/${userId}/edit`}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 active:bg-blue-700 transition-all text-xs shadow-sm shadow-blue-500/20"
          aria-label={`Edit user ${userName}`}
        >
          <Edit className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit User</span>
          <span className="sm:hidden">Edit</span>
        </Link>
      )}
    </motion.div>
  );
}
