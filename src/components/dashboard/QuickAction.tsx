// src/components/dashboard/QuickAction.tsx
import { cn } from '@/lib/utils';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

export function QuickAction({ icon, label, color, onClick }: QuickActionProps) {
  return (
    <button
      className="flex flex-col items-center gap-1.5 group"
      onClick={onClick}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:-translate-y-1 group-hover:shadow-md',
          `bg-gradient-to-br ${color}`,
        )}
      >
        {icon}
      </div>
      <span className="text-[9px] font-medium text-[#64748B] dark:text-[#94A3B8] text-center leading-tight font-outfit">
        {label}
      </span>
    </button>
  );
}
