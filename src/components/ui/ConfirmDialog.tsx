// src/components/ui/ConfirmDialog.tsx
'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Info,
  Trash2,
  X,
  CheckCircle,
  Lock,
  Unlock,
  Shield,
  UserX,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DialogVariant =
  | 'danger'
  | 'warning'
  | 'info'
  | 'success'
  | 'gold'
  | 'purple'
  | 'lock'
  | 'unlock'
  | 'delete'
  | 'activate'
  | 'deactivate';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: DialogVariant;
  isLoading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<
  DialogVariant,
  {
    overlay: string;
    icon: string;
    iconBg: string;
    button: string;
    border: string;
    Icon: LucideIcon;
    glow: string;
  }
> = {
  danger: {
    overlay: 'bg-red-500/10',
    icon: 'text-red-400',
    iconBg: 'bg-red-500/20',
    button:
      'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
    border: 'border-red-500/20',
    Icon: AlertTriangle,
    glow: 'shadow-red-500/10',
  },
  warning: {
    overlay: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    button:
      'bg-yellow-500 hover:bg-yellow-600 text-[#0F172A] shadow-lg shadow-yellow-500/25',
    border: 'border-yellow-500/20',
    Icon: AlertTriangle,
    glow: 'shadow-yellow-500/10',
  },
  info: {
    overlay: 'bg-blue-500/10',
    icon: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    button:
      'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-blue-500/25',
    border: 'border-blue-500/20',
    Icon: Info,
    glow: 'shadow-blue-500/10',
  },
  success: {
    overlay: 'bg-green-500/10',
    icon: 'text-green-400',
    iconBg: 'bg-green-500/20',
    button:
      'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-lg shadow-green-500/25',
    border: 'border-green-500/20',
    Icon: CheckCircle,
    glow: 'shadow-green-500/10',
  },
  gold: {
    overlay: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    button:
      'bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] shadow-lg shadow-yellow-500/25',
    border: 'border-yellow-500/20',
    Icon: CheckCircle,
    glow: 'shadow-yellow-500/10',
  },
  purple: {
    overlay: 'bg-purple-500/10',
    icon: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    button:
      'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-purple-500/25',
    border: 'border-purple-500/20',
    Icon: Shield,
    glow: 'shadow-purple-500/10',
  },
  lock: {
    overlay: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    button:
      'bg-yellow-500 hover:bg-yellow-600 text-[#0F172A] shadow-lg shadow-yellow-500/25',
    border: 'border-yellow-500/20',
    Icon: Lock,
    glow: 'shadow-yellow-500/10',
  },
  unlock: {
    overlay: 'bg-green-500/10',
    icon: 'text-green-400',
    iconBg: 'bg-green-500/20',
    button:
      'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-lg shadow-green-500/25',
    border: 'border-green-500/20',
    Icon: Unlock,
    glow: 'shadow-green-500/10',
  },
  delete: {
    overlay: 'bg-red-500/10',
    icon: 'text-red-400',
    iconBg: 'bg-red-500/20',
    button:
      'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
    border: 'border-red-500/20',
    Icon: Trash2,
    glow: 'shadow-red-500/10',
  },
  activate: {
    overlay: 'bg-green-500/10',
    icon: 'text-green-400',
    iconBg: 'bg-green-500/20',
    button:
      'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-lg shadow-green-500/25',
    border: 'border-green-500/20',
    Icon: UserCheck,
    glow: 'shadow-green-500/10',
  },
  deactivate: {
    overlay: 'bg-red-500/10',
    icon: 'text-red-400',
    iconBg: 'bg-red-500/20',
    button:
      'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
    border: 'border-red-500/20',
    Icon: UserX,
    glow: 'shadow-red-500/10',
  },
};

export function getVariantFromAction(
  action:
    | 'delete'
    | 'lock'
    | 'unlock'
    | 'activate'
    | 'deactivate'
    | 'warning'
    | 'info'
    | 'success',
): DialogVariant {
  const map: Record<string, DialogVariant> = {
    delete: 'delete',
    lock: 'lock',
    unlock: 'unlock',
    activate: 'activate',
    deactivate: 'deactivate',
    warning: 'warning',
    info: 'info',
    success: 'success',
  };
  return map[action] || 'info';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  variant = 'danger',
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant] || variantStyles.danger;
  const IconComponent = icon ? () => <>{icon}</> : styles.Icon;

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        {/* Increased z-index to ensure it appears above everything */}
        <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-[50%] top-[50%] z-[9999] w-full max-w-md translate-x-[-50%] translate-y-[-50%] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'relative bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl border border-[#334155] shadow-2xl p-6 overflow-hidden',
              styles.glow,
            )}
          >
            {/* Background glow effect */}
            <div
              className={cn(
                'absolute inset-0 pointer-events-none opacity-20',
                styles.overlay,
              )}
            />

            {/* Decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent" />

            {/* Close button - now with proper z-index and click handling */}
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all z-10"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </AlertDialog.Cancel>

            <div className="relative z-10">
              {/* Icon */}
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                  styles.iconBg,
                )}
              >
                <IconComponent className={cn('w-7 h-7', styles.icon)} />
              </div>

              {/* Title */}
              <AlertDialog.Title className="text-xl font-bold text-white mb-2 font-outfit">
                {title}
              </AlertDialog.Title>

              {/* Description */}
              <AlertDialog.Description
                className="text-sm text-gray-400 mb-6 leading-relaxed"
                asChild
              >
                <div>{description}</div>
              </AlertDialog.Description>

              {/* Actions */}
              <div className="flex gap-3">
                <AlertDialog.Cancel asChild>
                  <button
                    type="button"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-[#334155] hover:bg-white/10 hover:text-white transition-all"
                    onClick={() => onOpenChange(false)}
                  >
                    {cancelText}
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                      styles.button,
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      confirmText || 'Confirm'
                    )}
                  </button>
                </AlertDialog.Action>
              </div>
            </div>
          </motion.div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
