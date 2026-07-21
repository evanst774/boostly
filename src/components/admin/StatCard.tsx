// src/components/admin/StatCard.tsx
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20',
    text: 'text-[#2563EB] dark:text-[#60A5FA]',
  },
  green: {
    bg: 'bg-[#F0FDF4] dark:bg-[#22C55E]/20',
    text: 'text-[#22C55E] dark:text-[#4ADE80]',
  },
  yellow: {
    bg: 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20',
    text: 'text-[#F59E0B] dark:text-[#FBBF24]',
  },
  purple: {
    bg: 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20',
    text: 'text-[#8B5CF6] dark:text-[#A78BFA]',
  },
  red: {
    bg: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20',
    text: 'text-[#EF4444] dark:text-[#F87171]',
  },
};

export function StatCard({
  label,
  value,
  icon,
  change,
  changeType = 'up',
  color = 'blue',
  className,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            colors.bg,
            colors.text,
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0F172A] dark:text-white">
            {value}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</p>
        </div>
      </div>
      {change && (
        <div className="mt-2">
          <span
            className={cn(
              'text-xs font-semibold',
              changeType === 'up'
                ? 'text-[#22C55E] dark:text-[#4ADE80]'
                : changeType === 'down'
                  ? 'text-[#EF4444] dark:text-[#F87171]'
                  : 'text-[#64748B] dark:text-[#94A3B8]',
            )}
          >
            {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : ''}{' '}
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
