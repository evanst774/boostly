// components/auth/PermissionGate.tsx
'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  requiredPermission: string;
  fallback?: ReactNode;
  showRestrictedCard?: boolean;
}

export function PermissionGate({
  children,
  requiredPermission,
  fallback,
  showRestrictedCard = false,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-surface/30 rounded-xl" />
      </div>
    );
  }

  if (!hasPermission(requiredPermission)) {
    if (showRestrictedCard) {
      return (
        <div className="bg-surface/30 backdrop-blur-sm rounded-2xl border border-border-subtle p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Access Restricted
          </h3>
          <p className="text-sm text-gray-400">
            You don&apos;t have permission to access this feature. Please
            contact your administrator.
          </p>
        </div>
      );
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return null;
  }

  return <>{children}</>;
}
