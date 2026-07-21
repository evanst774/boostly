// src/components/dashboard/StatsCard.tsx
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  className?: string;
}

export function StatsCard({
  icon,
  value,
  label,
  change,
  changeType = 'up',
  iconBg = 'bg-[#F8FAFC]',
  iconColor = 'text-[#6B7280]',
  onClick,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-3.5',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            iconBg,
          )}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        {change && (
          <span
            className={cn(
              'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
              changeType === 'up'
                ? 'text-[#15803D] bg-[#F0FDF4] dark:bg-[#22C55E]/20 dark:text-[#4ADE80]'
                : changeType === 'down'
                  ? 'text-[#B91C1C] bg-[#FEF2F2] dark:bg-[#EF4444]/20 dark:text-[#F87171]'
                  : 'text-[#6B7280] bg-[#F8FAFC] dark:bg-[#334155] dark:text-[#94A3B8]',
            )}
          >
            {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : ''}{' '}
            {change}
          </span>
        )}
      </div>
      <p className="text-lg font-extrabold text-[#0F172A] dark:text-white font-outfit">
        {value}
      </p>
      <p className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8] mt-0.5">
        {label}
      </p>
    </div>
  );
}
