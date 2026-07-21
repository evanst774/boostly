// src/components/admin/roles/PermissionItem.tsx
'use client';

import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

interface PermissionItemProps {
  permission: { key: string; description: string };
  hasPerm: boolean;
  isToggling: boolean;
  onToggle: () => void;
}

export function PermissionItem({
  permission,
  hasPerm,
  isToggling,
  onToggle,
}: PermissionItemProps) {
  return (
    <button
      onClick={onToggle}
      disabled={isToggling}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all',
        hasPerm
          ? 'bg-green-500/10 hover:bg-green-500/15 border border-green-500/15'
          : 'hover:bg-white/5 border border-transparent',
      )}
    >
      <div
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
          hasPerm ? 'bg-green-500 border-green-500' : 'border-gray-500/50',
        )}
      >
        {hasPerm && <Check className="w-2.5 h-2.5 text-white" />}
        {isToggling && (
          <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-white">
          {permission.description}
        </div>
        <div className="text-[9px] text-gray-500 font-mono">
          {permission.key}
        </div>
      </div>
      {hasPerm && (
        <span className="text-[9px] text-green-400 font-semibold flex-shrink-0">
          GRANTED
        </span>
      )}
    </button>
  );
}
