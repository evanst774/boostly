// src/components/dashboard/StreakCard.tsx
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const streakDays = Math.min(streak, 7);
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-bold text-[#0F172A] dark:text-white font-outfit">
            Daily Streak
          </h3>
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            Claim your bonus every day
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-[#F59E0B] dark:text-[#FBBF24]">
            {streak}
          </p>
          <p className="text-[9px] text-[#94A3B8] dark:text-[#64748B]">
            day streak
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {days.map((day, index) => {
          const isDone = index < streakDays;
          const isToday = index === streakDays && streakDays < 7;

          return (
            <div
              key={index}
              className={cn(
                'flex-1 aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all',
                isDone
                  ? 'bg-[#22C55E] text-white dark:bg-[#22C55E]'
                  : isToday
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 dark:bg-[#2563EB]'
                    : 'bg-[#F8FAFC] text-[#94A3B8] dark:bg-[#334155] dark:text-[#64748B]',
              )}
            >
              <span className="text-[10px]">{day}</span>
              <span className="text-[8px] font-normal">
                {isDone ? '✓' : isToday ? '🔥' : '•'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        className="w-full bg-[#F59E0B] hover:bg-[#D97706] dark:bg-[#F59E0B] dark:hover:bg-[#D97706] text-[#0F172A] font-bold py-2.5 rounded-lg transition-colors text-xs font-outfit"
        onClick={() => router.push('/daily-bonus')}
      >
        🎁 Claim Today&apos;s Bonus - 100 RWF
      </button>
    </div>
  );
}
