// components/auth/PermissionGuard.tsx
'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions = [],
  fallback,
}: PermissionGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const {
    hasPermission,
    hasAllPermissions,
    isLoading: permLoading,
  } = usePermissions();

  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  let hasAccess = false;
  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions.length > 0) {
    hasAccess = hasAllPermissions(requiredPermissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    // Show restricted card instead of redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-400 text-sm">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
