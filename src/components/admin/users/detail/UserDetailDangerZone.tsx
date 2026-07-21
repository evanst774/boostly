// src/components/admin/users/detail/UserDetailDangerZone.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Trash2,
  UserX,
  Shield,
  Lock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Calendar,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SudoModal } from '@/components/auth/SudoModal';
import { UserDetailData } from '@/app/admin/types';
import type { SudoMethod } from '@/types/sudo';

interface UserDetailDangerZoneProps {
  user: UserDetailData;
  isSelfView: boolean;
  permissions: {
    canDeleteUsers: boolean;
    canDeleteSelf: boolean;
  };
  sudoActive: boolean;
  availableMethods: ('EMAIL' | 'TOTP')[];
  onRequestSudo: (
    method: 'EMAIL' | 'TOTP',
  ) => Promise<{ sessionId: string } | null>;
  onVerifySudo: (code: string, method: 'EMAIL' | 'TOTP') => Promise<boolean>;
  onDeleteUser: () => Promise<void>;
}

export function UserDetailDangerZone({
  user,
  isSelfView,
  permissions,
  sudoActive,
  availableMethods,
  onRequestSudo,
  onVerifySudo,
  onDeleteUser,
}: UserDetailDangerZoneProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSudoModal, setShowSudoModal] = useState(false);
  const [sudoMethod, setSudoMethod] = useState<SudoMethod>('EMAIL');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);

  const canDelete = isSelfView
    ? permissions.canDeleteSelf
    : permissions.canDeleteUsers;

  if (!canDelete) return null;

  const handleDeleteInitiate = () => {
    if (sudoActive) {
      setShowDeleteConfirm(true);
    } else {
      // Need sudo first
      const defaultMethod = availableMethods.includes('TOTP')
        ? 'TOTP'
        : availableMethods[0] || 'EMAIL';
      setSudoMethod(defaultMethod);
      setShowSudoModal(true);
    }
  };

  const handleSendSudoCode = async (method: SudoMethod) => {
    if (isSendingOtp || sendCooldown > 0) return;

    setIsSendingOtp(true);
    try {
      const result = await onRequestSudo(method);
      if (result) {
        setOtpSent(true);
        setSendCooldown(30);
      }
    } catch {
      // Error handled by hook
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSudoVerify = async (
    code: string,
    method: SudoMethod,
  ): Promise<boolean> => {
    const success = await onVerifySudo(code, method);
    if (success) {
      setShowSudoModal(false);
      setShowDeleteConfirm(true);
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteUser();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-red-500/5 to-red-600/5 backdrop-blur-xl rounded-2xl border border-red-500/20 overflow-hidden">
        {/* Header - Collapsible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-red-500/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-red-400 font-space-grotesk">
                Danger Zone
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Irreversible actions for this user account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!sudoActive && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-amber-500/20 border border-amber-500/25 text-amber-400">
                <Lock className="w-3 h-3" />
                Sudo Required
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </button>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-6 space-y-4">
                {/* Warning Banner */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-400 mb-1">
                        Warning: Permanent Action
                      </p>
                      <p className="text-xs text-gray-400">
                        Deleting this user will permanently remove their
                        account, permissions, and all associated data. This
                        action cannot be undone.
                        {isSelfView && (
                          <span className="block mt-1 text-amber-400">
                            You are about to delete your own account. Make sure
                            you have a backup admin account before proceeding.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Info Summary */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Account Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-[10px] text-gray-500">User</p>
                        <p className="text-xs text-white font-medium truncate">
                          {user.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-[10px] text-gray-500">Email</p>
                        <p className="text-xs text-white font-medium truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-[10px] text-gray-500">Joined</p>
                        <p className="text-xs text-white font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-[10px] text-gray-500">Role</p>
                        <p className="text-xs text-white font-medium capitalize">
                          {user.roleName?.replace(/_/g, ' ') || 'No Role'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleDeleteInitiate}
                    disabled={isDeleting}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                      'bg-red-500 hover:bg-red-600 text-white',
                      'hover:shadow-lg hover:shadow-red-500/25',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'touch-min-target',
                    )}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete {isSelfView ? 'My Account' : 'User Account'}
                      </>
                    )}
                  </button>

                  {!sudoActive && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">
                        Sudo mode required
                      </span>
                    </div>
                  )}
                </div>

                {/* Sudo Active Indicator */}
                {sudoActive && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      Sudo mode active - elevated permissions granted
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={isSelfView ? 'Delete Your Account?' : 'Delete User Account?'}
        description={
          <div className="space-y-3">
            <p>
              {isSelfView
                ? 'Are you absolutely sure you want to delete your own account? This action cannot be reversed.'
                : `Are you sure you want to permanently delete ${user.name}'s account?`}
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-400 font-medium">
                This will permanently:
              </p>
              <ul className="text-xs text-gray-400 mt-1 space-y-1 list-disc list-inside">
                <li>Delete the user account and all profile data</li>
                <li>Remove all assigned permissions</li>
                <li>Invalidate all active sessions</li>
                {!isSelfView && <li>Preserve audit logs for accountability</li>}
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
        }
        confirmText={isSelfView ? 'Delete My Account' : 'Delete User'}
        onConfirm={handleConfirmDelete}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Sudo Modal */}
      <SudoModal
        isOpen={showSudoModal}
        onClose={() => setShowSudoModal(false)}
        onVerify={handleSudoVerify}
        method={sudoMethod}
        loading={false}
        availableMethods={availableMethods}
        onMethodChange={setSudoMethod}
        onSendCode={handleSendSudoCode}
        isSending={isSendingOtp}
        otpSent={otpSent}
        sendCooldown={sendCooldown}
      />
    </>
  );
}
