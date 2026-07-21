// components/auth/PermissionButton.tsx
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface PermissionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  requiredPermission: string;
  fallback?: ReactNode;
  showDisabled?: boolean;
  disabledMessage?: string;
  showIcon?: boolean;
}

export function PermissionButton({
  children,
  requiredPermission,
  fallback,
  showDisabled = false,
  disabledMessage = "You don't have permission to perform this action",
  showIcon = true,
  className,
  disabled,
  title,
  ...props
}: PermissionButtonProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <button
        className={cn(
          'px-4 py-2 rounded-xl bg-surface/50 animate-pulse cursor-wait',
          className,
        )}
        disabled
      >
        Loading...
      </button>
    );
  }

  const hasRequiredPermission = hasPermission(requiredPermission);

  // If user doesn't have permission and we want to show disabled button
  if (!hasRequiredPermission && showDisabled) {
    return (
      <button
        className={cn(
          'px-4 py-2 rounded-xl bg-surface/30 text-gray-500 cursor-not-allowed opacity-60 transition-all',
          className,
        )}
        disabled
        title={disabledMessage}
        {...props}
      >
        <div className="flex items-center gap-2">
          {showIcon && <Shield className="w-4 h-4" />}
          {children}
        </div>
      </button>
    );
  }

  if (!hasRequiredPermission && fallback) {
    return <>{fallback}</>;
  }

  if (!hasRequiredPermission) {
    return null;
  }

  // User has permission
  return (
    <button
      className={cn(
        'transition-all duration-200',
        className,
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      disabled={disabled}
      title={disabled ? title : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
