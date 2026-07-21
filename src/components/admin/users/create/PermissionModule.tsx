// src/components/admin/users/PermissionModule.tsx
'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, Check } from 'lucide-react';
import { PermissionItem } from './PermissionItem';
import { PermissionOption } from '@/app/admin/types';

interface PermissionModuleProps {
  module: string;
  permissions: PermissionOption[];
  selectedPermissions: string[];
  isExpanded: boolean;
  onToggleModule: () => void;
  onTogglePermission: (key: string) => void;
}

export function PermissionModule({
  module,
  permissions,
  selectedPermissions,
  isExpanded,
  onToggleModule,
  onTogglePermission,
}: PermissionModuleProps) {
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
          'w-full flex items-center justify-between px-4 py-2.5 transition-all text-left border',
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
              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
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
            <span className="text-sm font-semibold text-white capitalize">
              {module.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-gray-500 ml-2">
              {permissions.length}
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
        <div className="bg-surface/20 border border-t-0 border-border-subtle rounded-b-xl p-2 space-y-0.5">
          {permissions.map((perm) => (
            <PermissionItem
              key={perm.key}
              permission={perm}
              isSelected={selectedPermissions.includes(perm.key)}
              onToggle={onTogglePermission}
            />
          ))}
        </div>
      )}
    </div>
  );
}
