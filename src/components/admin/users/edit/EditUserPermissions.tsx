// src/components/admin/users/edit/EditUserPermissions.tsx
'use client';

import {
  Search,
  X,
  Shield,
  Info,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditUserPermissionModule } from './EditUserPermissionModule';
import { PermissionOption } from '@/app/admin/types';

interface EditUserPermissionsProps {
  userOverridePermissions: string[];
  hasOverride: boolean;
  hasRoleSelected: boolean;
  hasPermissions: boolean;
  roleName: string;
  permissionSearch: string;
  selectedCount: number;
  totalRoleCount: number;
  expandedModules: string[];
  filteredModules: [string, PermissionOption[]][];
  isSaving: boolean;
  onPermissionSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleModuleExpand: (module: string) => void;
  onTogglePermission: (key: string) => void;
  onResetToRole: () => void;
}

export function EditUserPermissions({
  userOverridePermissions,
  hasOverride,
  hasRoleSelected,
  hasPermissions,
  roleName,
  permissionSearch,
  selectedCount,
  totalRoleCount,
  expandedModules,
  filteredModules,
  isSaving,
  onPermissionSearchChange,
  onClearSearch,
  onToggleModuleExpand,
  onTogglePermission,
  onResetToRole,
}: EditUserPermissionsProps) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
      {/* Panel header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Permission Overrides
            {hasOverride && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/25 text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                Custom Override Active
              </span>
            )}
            {!hasOverride && hasRoleSelected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 border border-purple-500/25 text-purple-400">
                <Info className="w-3 h-3" />
                Inheriting from Role
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {hasOverride && (
              <button
                onClick={onResetToRole}
                disabled={isSaving}
                className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition-all touch-manipulation min-h-[32px]"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Role Defaults
              </button>
            )}
            <span className="text-[10px] text-gray-500">
              {selectedCount}/{totalRoleCount} granted
            </span>
          </div>
        </div>

        <div
          className={cn(
            'p-3 rounded-xl text-xs border',
            hasOverride
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-300',
          )}
        >
          {hasOverride ? (
            <p>
              ⚠️ <strong>Custom override is active.</strong> This user&apos;s
              permissions no longer follow the <strong>{roleName}</strong> role
              Matrix. Changes to the {roleName} role in the Matrix will NOT
              affect this user. Click{' '}
              <strong>&quot;Reset to Role Defaults&quot;</strong> to revert.
            </p>
          ) : hasRoleSelected ? (
            <p>
              📋 <strong>Inheriting from {roleName} role.</strong> Only
              permissions granted to the <strong>{roleName}</strong> role in the
              Matrix are shown below. You can <strong>uncheck</strong> items to
              create a custom override (remove permissions from this user only).
              You <strong>cannot grant</strong> permissions that the role
              doesn&apos;t have.
            </p>
          ) : (
            <p>
              ⚠️ <strong>No role assigned.</strong> Select a role above to
              inherit permissions from the Matrix, or assign custom permissions.
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={permissionSearch}
            onChange={(e) => onPermissionSearchChange(e.target.value)}
            placeholder="Search permissions or modules..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
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

      {/* Module list */}
      <div className="p-4 space-y-2 max-h-[550px] overflow-y-auto">
        {hasRoleSelected && !hasPermissions ? (
          <div className="text-center py-10">
            <Shield className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-xs text-gray-500">
              This role has no permissions assigned in the Matrix.
            </p>
            <p className="text-[10px] text-gray-600 mt-1">
              Go to Roles & Permissions to configure this role.
            </p>
          </div>
        ) : !hasRoleSelected ? (
          <div className="text-center py-10">
            <Info className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-xs text-gray-500">
              Select a role to view available permissions.
            </p>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-gray-500">
              No permissions match your search.
            </p>
          </div>
        ) : (
          filteredModules.map(([module, perms]) => (
            <EditUserPermissionModule
              key={module}
              module={module}
              permissions={perms}
              selectedPermissions={userOverridePermissions}
              isExpanded={expandedModules.includes(module)}
              hasOverride={hasOverride}
              onToggleModule={() => onToggleModuleExpand(module)}
              onTogglePermission={onTogglePermission}
            />
          ))
        )}
      </div>
    </div>
  );
}
