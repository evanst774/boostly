// src/components/ui/Dialog.tsx
'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
          <h3 className="text-lg font-bold">{title || 'Dialog'}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className={cn('p-6', className)}>
          {description && (
            <p className="text-sm text-[#6B7280] mb-4">{description}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// Confirmation Dialog
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
}: ConfirmDialogProps) {
  const buttonColors = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8]',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626]',
    success: 'bg-[#22C55E] hover:bg-[#16A34A]',
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-[#6B7280] mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors text-sm font-medium"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            'flex-1 py-3 rounded-xl text-white font-bold transition-colors',
            buttonColors[confirmVariant],
          )}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  );
}

// Alert Dialog
interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
}: AlertDialogProps) {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center py-4">
        <div className="text-5xl mb-4">{icons[type]}</div>
        <p className="text-[#6B7280]">{message}</p>
        <button
          onClick={onClose}
          className={cn(
            'mt-6 w-full py-3 rounded-xl text-white font-bold transition-colors',
            type === 'error'
              ? 'bg-[#EF4444] hover:bg-[#DC2626]'
              : type === 'success'
                ? 'bg-[#22C55E] hover:bg-[#16A34A]'
                : type === 'warning'
                  ? 'bg-[#F59E0B] hover:bg-[#D97706]'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8]',
          )}
        >
          Got it
        </button>
      </div>
    </Dialog>
  );
}
