// src/components/admin/users/PermissionItem.tsx
'use client';

import { PermissionOption } from '@/app/admin/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PermissionItemProps {
  permission: PermissionOption;
  isSelected: boolean;
  onToggle: (key: string) => void;
}

export function PermissionItem({
  permission,
  isSelected,
  onToggle,
}: PermissionItemProps) {
  return (
    <button
      onClick={() => onToggle(permission.key)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-all',
        isSelected
          ? 'bg-green-500/10 hover:bg-green-500/15 border border-green-500/15'
          : 'hover:bg-white/5 border border-transparent',
      )}
    >
      <div
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
          isSelected ? 'bg-green-500 border-green-500' : 'border-gray-500/50',
        )}
      >
        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-white">
          {permission.description}
        </div>
        <div className="text-[9px] text-gray-500 font-mono">
          {permission.key}
        </div>
      </div>
      {isSelected && (
        <span className="text-[9px] text-green-400 font-semibold ml-auto flex-shrink-0">
          GRANTED
        </span>
      )}
    </button>
  );
}
