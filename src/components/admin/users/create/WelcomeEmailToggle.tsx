// src/components/admin/users/WelcomeEmailToggle.tsx
'use client';

import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

interface WelcomeEmailToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function WelcomeEmailToggle({
  enabled,
  onToggle,
}: WelcomeEmailToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
      <div className="flex items-center gap-2">
        <Send className="w-4 h-4 text-blue-400" />
        <div>
          <div className="text-xs font-semibold text-white">
            Send Welcome Email
          </div>
          <div className="text-[10px] text-gray-500">
            Notify user with login instructions
          </div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'w-10 h-5 rounded-full transition-all relative',
          enabled ? 'bg-blue-500' : 'bg-gray-600',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
            enabled ? 'right-0.5' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
