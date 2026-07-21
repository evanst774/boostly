// src/components/admin/users/UserDetailPanel.tsx
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
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
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { roleConfig } from './configs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SudoModal } from '@/components/auth/SudoModal';
import { useSudoAction } from '@/hooks/useSudoAction';
import { UserRecord } from '@/app/admin/types';

interface UserDetailPanelProps {
  user: UserRecord;
  isCurrentUser: boolean;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  formatDate: (date: string | null) => string;
}

export function UserDetailPanel({
  user,
  isCurrentUser,
  onToggleStatus,
  formatDate,
}: UserDetailPanelProps) {
  const rCfg = roleConfig[user.roleName] || {
    bg: 'rgba(100,116,139,0.15)',
    color: '#94a3b8',
    label: user.roleName?.replace(/_/g, ' ') || 'No Role',
    icon: <User className="w-3 h-3" />,
    gradient: 'from-gray-500/20 to-gray-600/20',
  };

  // ─── Sudo Mode ──────────────────────────────────────────────────────────

  const {
    sudoActive,
    availableMethods,
    methodsLoading,
    showSudoModal,
    sudoMethod,
    isSudoPending,
    isSendingOtp,
    otpSent,
    sendCooldown,
    initiateSudoAction,
    handleSudoVerify,
    handleSendSudoCode,
    handleSudoModalClose,
    setSudoMethod,
  } = useSudoAction();

  // ─── State ──────────────────────────────────────────────────────────────

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleClick = useCallback(() => {
    if (isCurrentUser) return;
    initiateSudoAction(() => setShowConfirmDialog(true));
  }, [isCurrentUser, initiateSudoAction]);

  const handleSudoVerified = useCallback(
    async (code: string, method: 'EMAIL' | 'TOTP'): Promise<boolean> => {
      const success = await handleSudoVerify(code, method);
      if (success) {
        setShowConfirmDialog(true);
      }
      return success;
    },
    [handleSudoVerify],
  );

  const handleSudoModalClosed = useCallback(() => {
    handleSudoModalClose();
  }, [handleSudoModalClose]);

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

  const show2FAWarning =
    !methodsLoading && availableMethods.length === 0 && !isCurrentUser;

  return (
    <>
      <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl sticky top-4">
        {/* ─── Status Banners ────────────────────────────────────────────── */}
        {sudoActive && (
          <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <p className="text-[10px] text-green-400">
              Sudo mode active - elevated permissions enabled
            </p>
          </div>
        )}

        {show2FAWarning && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-400">
              2FA required for sensitive actions.{' '}
              <a
                href="/settings/security#twofa"
                className="underline font-medium hover:text-amber-300 transition-colors"
              >
                Set up 2FA →
              </a>
            </p>
          </div>
        )}

        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            User Details
            {isCurrentUser && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                YOU
              </span>
            )}
          </h3>
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
        </div>
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white mx-auto mb-2 shadow-lg">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-sm font-bold text-white">{user.name}</div>
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
              <span className="text-xs text-white">{user.phone || '—'}</span>
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
            ) : isSudoPending ? (
              <>
                <Shield className="w-4 h-4 animate-pulse" />
                Verifying...
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
      </div>

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

      {/* ─── Sudo Modal ──────────────────────────────────────────────────── */}

      <SudoModal
        isOpen={showSudoModal}
        onClose={handleSudoModalClosed}
        onVerify={handleSudoVerified}
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
