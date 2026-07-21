// src/components/admin/users/edit/EditUserPermissionModule.tsx
'use client';

import { PermissionOption } from '@/app/admin/types';
import { cn } from '@/lib/utils';
import { ChevronRight, Check, AlertCircle } from 'lucide-react';

interface EditUserPermissionModuleProps {
  module: string;
  permissions: PermissionOption[];
  selectedPermissions: string[];
  isExpanded: boolean;
  hasOverride?: boolean;
  onToggleModule: () => void;
  onTogglePermission: (key: string) => void;
}

export function EditUserPermissionModule({
  module,
  permissions,
  selectedPermissions,
  isExpanded,
  hasOverride = false,
  onToggleModule,
  onTogglePermission,
}: EditUserPermissionModuleProps) {
  const moduleSelected = permissions.every((p) =>
    selectedPermissions.includes(p.key),
  );
  const modulePartial =
    permissions.some((p) => selectedPermissions.includes(p.key)) &&
    !moduleSelected;

  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={onToggleModule}
        className={cn(
          'w-full flex items-center justify-between px-5 py-3 transition-all text-left border',
          moduleSelected
            ? 'bg-green-500/10 border-green-500/20'
            : modulePartial
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-surface/30 border-border-subtle hover:bg-white/5',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
              moduleSelected
                ? 'bg-green-500 border-green-500'
                : modulePartial
                  ? 'bg-amber-500 border-amber-500'
                  : 'border-gray-600',
            )}
          >
            {(moduleSelected || modulePartial) && (
              <Check className="w-3 h-3 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white capitalize">
                {module.replace(/_/g, ' ')}
              </span>
              {hasOverride && modulePartial && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Override
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-500 ml-0">
              {permissions.length} permissions
            </span>
          </div>
        </div>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform',
            isExpanded && 'rotate-90',
          )}
        />
      </button>
      {isExpanded && (
        <div className="bg-surface/20 border border-t-0 border-border-subtle rounded-b-xl p-2 space-y-1">
          {permissions.map((perm) => {
            const isSelected = selectedPermissions.includes(perm.key);
            const isOverridden = hasOverride && isSelected;

            return (
              <button
                key={perm.key}
                onClick={() => onTogglePermission(perm.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all',
                  isSelected
                    ? isOverridden
                      ? 'bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/15'
                      : 'bg-green-500/10 hover:bg-green-500/15 border border-green-500/15'
                    : 'hover:bg-white/5 border border-transparent',
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                    isSelected
                      ? isOverridden
                        ? 'bg-amber-500 border-amber-500'
                        : 'bg-green-500 border-green-500'
                      : 'border-gray-500/50',
                  )}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white">
                    {perm.description}
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono">
                    {perm.key}
                  </div>
                </div>
                {isSelected && (
                  <span
                    className={cn(
                      'text-[9px] font-semibold shrink-0',
                      isOverridden ? 'text-amber-400' : 'text-green-400',
                    )}
                  >
                    {isOverridden ? 'OVERRIDE' : 'GRANTED'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
