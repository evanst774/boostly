// src/components/admin/users/detail/UserDetailInfoCard.tsx
'use client';

import { cn } from '@/lib/utils';

interface UserDetailInfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}

export function UserDetailInfoCard({
  icon,
  label,
  value,
  bg,
}: UserDetailInfoCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 p-3 flex items-center gap-3 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm hover:border-white/20 transition-all duration-300 touch-manipulation',
        bg,
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-space-grotesk font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-xs font-space-grotesk font-semibold text-white truncate">
          {value}
        </div>
      </div>
    </div>
  );
}
