// src/components/admin/users/UsersTableRow.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Edit, UserX, UserCheck, Eye, User } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserRecord } from '@/app/admin/types';
import { roleConfig } from './configs';

interface UsersTableRowProps {
  user: UserRecord;
  index: number;
  page: number;
  pageSize: number;
  isCurrentUser: boolean;
  onSelectUser: (user: UserRecord) => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  formatDate: (date: string | null) => string;
}

export function UsersTableRow({
  user,
  index,
  page,
  pageSize,
  isCurrentUser,
  onSelectUser,
  onToggleStatus,
  formatDate,
}: UsersTableRowProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const rCfg = roleConfig[user.roleName] || {
    bg: 'rgba(100,116,139,0.15)',
    color: '#94a3b8',
    label: user.roleName?.replace(/_/g, ' ') || 'No Role',
    icon: <User className="w-3 h-3" />,
    gradient: 'from-gray-500/20 to-gray-600/20',
  };
  const rowNumber = (page - 1) * pageSize + index + 1;

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmToggle = async () => {
    setIsProcessing(true);
    await onToggleStatus(user.id, user.isActive);
    setIsProcessing(false);
    setShowConfirmDialog(false);
  };

  const dialogTitle = user.isActive ? 'Deactivate User' : 'Activate User';
  const dialogDescription = user.isActive
    ? `Are you sure you want to deactivate ${user.name}? This user will no longer be able to access the system.`
    : `Are you sure you want to activate ${user.name}? This user will gain access to the system.`;
  const dialogConfirmText = user.isActive ? 'Deactivate' : 'Activate';
  const dialogVariant = user.isActive ? 'danger' : 'success';

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.015 }}
        className="border-b border-white/5 hover:bg-white/[0.03] transition-all group cursor-pointer"
        onClick={() => onSelectUser(user)}
      >
        <td className="py-4 px-4">
          <span className="text-sm text-gray-500 font-mono">
            {String(rowNumber).padStart(2, '0')}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg',
                user.isActive
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-gray-600 to-gray-700',
              )}
            >
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                {user.name}
                {isCurrentUser && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 hidden sm:table-cell">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
            style={{
              background: rCfg.bg,
              color: rCfg.color,
              borderColor: `${rCfg.color}30`,
            }}
          >
            {rCfg.icon}
            {rCfg.label}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                user.isActive
                  ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]'
                  : 'bg-red-500',
              )}
            />
            <span
              className={cn(
                'text-xs font-semibold',
                user.isActive ? 'text-green-400' : 'text-red-400',
              )}
            >
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </td>
        <td className="py-4 px-4 hidden lg:table-cell">
          <span className="text-xs text-gray-400">
            {formatDate(user.lastLoginAt)}
          </span>
        </td>
        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Link
                  href={`/admin/users/${user.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100',
                    isCurrentUser
                      ? 'text-gray-600 cursor-not-allowed opacity-30'
                      : 'text-gray-400 hover:text-white hover:bg-white/10',
                  )}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md shadow-lg">
                  {isCurrentUser ? 'Cannot edit yourself' : 'Edit'}
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={handleToggleClick}
                  disabled={isCurrentUser}
                  className={cn(
                    'p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100',
                    isCurrentUser
                      ? 'text-gray-600 cursor-not-allowed opacity-30'
                      : user.isActive
                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10',
                  )}
                >
                  {user.isActive ? (
                    <UserX className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md shadow-lg">
                  {isCurrentUser
                    ? 'Cannot modify yourself'
                    : user.isActive
                      ? 'Deactivate'
                      : 'Activate'}
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Link
                  href={`/admin/users/${user.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md shadow-lg">
                  View Details
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        </td>
      </motion.tr>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={dialogTitle}
        description={dialogDescription}
        confirmText={dialogConfirmText}
        variant={dialogVariant}
        isLoading={isProcessing}
        onConfirm={handleConfirmToggle}
      />
    </>
  );
}
