// src/components/admin/roles/PermissionMatrix.tsx
'use client';

import { Shield } from 'lucide-react';
import { PermissionModule } from './PermissionModule';
import { LoadingSpinner } from './LoadingSpinner';
import { PermissionOption } from '@/app/admin/types';

interface PermissionMatrixProps {
  selectedRole: { id: string; name: string; permissions: string[] } | null;
  filteredModuleGroups: Record<string, PermissionOption[]>;
  expandedModules: string[];
  toggling: string | null;
  loading: boolean;
  onToggleModuleExpand: (module: string) => void;
  onTogglePermission: (
    roleId: string,
    permissionKey: string,
    hasPerm: boolean,
    roleName: string,
    permissionDesc: string,
  ) => void;
}

export function PermissionMatrix({
  selectedRole,
  filteredModuleGroups,
  expandedModules,
  toggling,
  loading,
  onToggleModuleExpand,
  onTogglePermission,
}: PermissionMatrixProps) {
  if (!selectedRole) {
    return (
      <div className="p-12 text-center">
        <Shield className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
        <p className="text-gray-500">
          Select a role above to view and manage its permissions
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading permission matrix..." />;
  }

  return (
    <div className="p-3 max-h-[600px] overflow-y-auto space-y-1">
      {Object.entries(filteredModuleGroups).map(([module, perms]) => (
        <PermissionModule
          key={module}
          module={module}
          permissions={perms}
          rolePermissions={selectedRole.permissions}
          isExpanded={expandedModules.includes(module)}
          toggling={toggling}
          roleId={selectedRole.id}
          roleName={selectedRole.name}
          onToggleModule={() => onToggleModuleExpand(module)}
          onTogglePermission={onTogglePermission}
        />
      ))}
    </div>
  );
}
