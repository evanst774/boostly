// src/components/admin/users/PermissionsPanel.tsx
'use client';

import { Search, X, Info, Shield } from 'lucide-react';
import { PermissionModule } from './PermissionModule';
import { PermissionOption } from '@/app/admin/types';

interface PermissionsPanelProps {
  rolePermissions: PermissionOption[];
  selectedPermissions: string[];
  hasRoleSelected: boolean;
  hasPermissions: boolean;
  roleName: string;
  permissionSearch: string;
  onPermissionSearchChange: (value: string) => void;
  onClearSearch: () => void;
  expandedModules: string[];
  onToggleModuleExpand: (module: string) => void;
  onTogglePermission: (key: string) => void;
  moduleGroups: [string, PermissionOption[]][];
}

export function PermissionsPanel({
  rolePermissions,
  selectedPermissions,
  hasRoleSelected,
  hasPermissions,
  roleName,
  permissionSearch,
  onPermissionSearchChange,
  onClearSearch,
  expandedModules,
  onToggleModuleExpand,
  onTogglePermission,
  moduleGroups,
}: PermissionsPanelProps) {
  const totalPermissions = rolePermissions.length;
  const grantedCount = selectedPermissions.length;

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Role Permissions
            {hasRoleSelected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 border border-purple-500/25 text-purple-400">
                <Info className="w-3 h-3" />
                From {roleName} Matrix
              </span>
            )}
          </h3>
          <span className="text-[10px] text-gray-500">
            {grantedCount}/{totalPermissions} granted
          </span>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          {hasRoleSelected ? (
            <p>
              📋 Showing permissions from the <strong>{roleName}</strong> role
              Matrix. You can <strong>uncheck</strong> items to create a subset
              override for this user. You <strong>cannot grant</strong>{' '}
              permissions the role doesn&apos;t have.
            </p>
          ) : (
            <p>
              ⚠️ <strong>Select a role above</strong> to auto-fill permissions
              from the Matrix.
            </p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={permissionSearch}
            onChange={(e) => onPermissionSearchChange(e.target.value)}
            placeholder="Search permissions..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
          />
          {permissionSearch && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg touch-manipulation min-h-[32px]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Permissions List */}
      <div className="p-3 space-y-1 max-h-[500px] overflow-y-auto">
        {!hasRoleSelected ? (
          <div className="text-center py-8">
            <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              Select a role to view available permissions.
            </p>
          </div>
        ) : !hasPermissions ? (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              This role has no permissions assigned in the Matrix.
            </p>
          </div>
        ) : moduleGroups.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">
              No permissions match your search.
            </p>
          </div>
        ) : (
          moduleGroups.map(([module, perms]) => (
            <PermissionModule
              key={module}
              module={module}
              permissions={perms}
              selectedPermissions={selectedPermissions}
              isExpanded={expandedModules.includes(module)}
              onToggleModule={() => onToggleModuleExpand(module)}
              onTogglePermission={onTogglePermission}
            />
          ))
        )}
      </div>
    </div>
  );
}
