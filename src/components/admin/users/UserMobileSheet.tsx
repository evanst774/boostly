// src/components/admin/users/UserMobileSheet.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  X,
  Mail,
  Phone,
  Clock,
  Calendar,
  Edit,
  UserX,
  UserCheck,
  Lock,
  BadgeCheck,
  User,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserRecord } from '@/app/admin/types';
import { roleConfig } from './configs';

interface UserMobileSheetProps {
  open: boolean;
  user: UserRecord | null;
  isCurrentUser: boolean;
  onClose: () => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  formatDate: (date: string | null) => string;
}

export function UserMobileSheet({
  open,
  user,
  isCurrentUser,
  onClose,
  onToggleStatus,
  formatDate,
}: UserMobileSheetProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user) return null;

  const rCfg = roleConfig[user.roleName] || {
    bg: 'rgba(100,116,139,0.15)',
    color: '#94a3b8',
    label: user.roleName?.replace(/_/g, ' ') || 'No Role',
    icon: <User className="w-3 h-3" />,
    gradient: 'from-gray-500/20 to-gray-600/20',
  };

  const handleToggleClick = () => {
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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 xl:hidden bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#0d1e38] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  User Details
                  {isCurrentUser && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      YOU
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      user.isActive
                        ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                        : 'text-red-400 bg-red-500/10 border border-red-500/20',
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        user.isActive ? 'bg-green-500' : 'bg-red-500',
                      )}
                    />
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white mx-auto mb-2 shadow-lg">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {user.name}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-1"
                    style={{
                      background: rCfg.bg,
                      color: rCfg.color,
                      borderColor: `${rCfg.color}30`,
                    }}
                  >
                    {rCfg.icon}
                    {rCfg.label}
                  </span>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400">Email</span>
                    </div>
                    <span className="text-xs text-white truncate max-w-[160px]">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400">Phone</span>
                    </div>
                    <span className="text-xs text-white">
                      {user.phone || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400">Last Login</span>
                    </div>
                    <span className="text-xs text-gray-300">
                      {formatDate(user.lastLoginAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400">Joined</span>
                    </div>
                    <span className="text-xs text-gray-300">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Permissions ({user.permissions.length})
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/10 p-3 space-y-1.5 max-h-32 overflow-y-auto">
                    {user.permissions.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">
                        No permissions
                      </p>
                    ) : (
                      user.permissions.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <BadgeCheck className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span className="text-[11px] text-gray-300 truncate">
                            {p.description}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Link
                  href={`/admin/users/${user.id}/edit`}
                  className="w-full px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit User
                </Link>

                <button
                  onClick={handleToggleClick}
                  disabled={isCurrentUser}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                    isCurrentUser
                      ? 'bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed'
                      : user.isActive
                        ? 'bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20',
                  )}
                >
                  {isCurrentUser ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Cannot modify yourself
                    </>
                  ) : user.isActive ? (
                    <>
                      <UserX className="w-4 h-4" />
                      Deactivate User
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Activate User
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
