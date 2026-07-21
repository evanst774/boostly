// src/components/admin/roles/PermissionModule.tsx
'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, Check } from 'lucide-react';
import { PermissionItem } from './PermissionItem';
import { formatModuleName } from './configs';
import { PermissionOption } from '@/app/admin/types';

interface PermissionModuleProps {
  module: string;
  permissions: PermissionOption[];
  rolePermissions: string[];
  isExpanded: boolean;
  toggling: string | null;
  roleId: string;
  onToggleModule: () => void;
  onTogglePermission: (
    roleId: string,
    permissionKey: string,
    hasPerm: boolean,
    roleName: string,
    permissionDesc: string,
  ) => void;
  roleName: string;
}

export function PermissionModule({
  module,
  permissions,
  rolePermissions,
  isExpanded,
  toggling,
  roleId,
  onToggleModule,
  onTogglePermission,
  roleName,
}: PermissionModuleProps) {
  const moduleGranted = permissions.filter((p) =>
    rolePermissions.includes(p.key),
  ).length;
  const allModuleGranted = moduleGranted === permissions.length;

  return (
    <div className="rounded-xl overflow-hidden touch-manipulation">
      <button
        onClick={onToggleModule}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 transition-all duration-200 text-left border touch-min-target',
          allModuleGranted
            ? 'bg-green-500/10 border-green-500/25'
            : moduleGranted > 0
              ? 'bg-amber-500/10 border-amber-500/25'
              : 'bg-white/5 border-white/10 hover:bg-white/10',
        )}
        aria-label={`Toggle ${formatModuleName(module)} module`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
              allModuleGranted
                ? 'bg-green-500 border-green-500'
                : moduleGranted > 0
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-gray-600',
            )}
          >
            {allModuleGranted && <Check className="w-3 h-3 text-white" />}
            {!allModuleGranted && moduleGranted > 0 && (
              <span className="text-[8px] text-amber-400 font-bold">
                {moduleGranted}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-white capitalize font-space-grotesk">
              {formatModuleName(module)}
            </span>
            <span className="text-[10px] text-gray-500 ml-2 font-space-grotesk">
              {moduleGranted}/{permissions.length} granted
            </span>
          </div>
        </div>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0',
            isExpanded && 'rotate-90',
          )}
        />
      </button>
      {isExpanded && (
        <div className="bg-white/5 border border-t-0 border-white/10 rounded-b-xl p-2 space-y-0.5">
          {permissions.map((perm) => {
            const hasPerm = rolePermissions.includes(perm.key);
            const isTogglingPerm = toggling === `${roleId}-${perm.key}`;
            return (
              <PermissionItem
                key={perm.key}
                permission={perm}
                hasPerm={hasPerm}
                isToggling={isTogglingPerm}
                onToggle={() =>
                  onTogglePermission(
                    roleId,
                    perm.key,
                    hasPerm,
                    roleName,
                    perm.description,
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
