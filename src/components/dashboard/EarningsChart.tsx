// src/components/dashboard/EarningsChart.tsx
import { cn } from '@/lib/utils';

interface EarningsChartProps {
  data?: Array<{ day: string; amount: number }>;
}

export function EarningsChart({ data = defaultData }: EarningsChartProps) {
  const maxValue = Math.max(...data.map((d) => d.amount));

  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;
        const isActive = index === 6;

        return (
          <div
            key={item.day}
            className="flex-1 flex flex-col items-center gap-1.5"
          >
            <span className="text-[9px] font-semibold text-[#94A3B8] dark:text-[#64748B] font-outfit">
              {item.amount >= 1000
                ? (item.amount / 1000).toFixed(1) + 'k'
                : item.amount}
            </span>
            <div
              className={cn(
                'w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer',
                isActive
                  ? 'bg-[#2563EB] dark:bg-[#60A5FA]'
                  : 'bg-[#DBEAFE] dark:bg-[#334155]',
              )}
              style={{ height: Math.max(height, 4) + '%', minHeight: '6px' }}
            />
            <span className="text-[9px] font-medium text-[#94A3B8] dark:text-[#64748B] font-outfit">
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const defaultData = [
  { day: 'Mon', amount: 0 },
  { day: 'Tue', amount: 0 },
  { day: 'Wed', amount: 0 },
  { day: 'Thu', amount: 0 },
  { day: 'Fri', amount: 0 },
  { day: 'Sat', amount: 0 },
  { day: 'Sun', amount: 0 },
];
