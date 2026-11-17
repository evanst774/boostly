// src/components/earn/DailyBonusCard.tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

/** Claim today's check-in bonus. Streak milestones pay extra on day 7/14/30. */
export function DailyBonusCard({
  bonus,
  onClaimed,
}: {
  bonus: { amount: number; claimed: boolean; streakDay: number };
  onClaimed: () => void;
}) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(bonus.claimed);
  const [error, setError] = useState<string | null>(null);

  const claim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-bonus', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (res.ok || res.status === 409) {
        setClaimed(true);
        onClaimed();
      } else {
        setError(json.error || 'Could not claim your bonus. Try again.');
      }
    } catch {
      setError('Connection problem. Try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 flex items-center gap-3',
        claimed
          ? 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]'
          : 'border-[#F59E0B]/40 bg-gradient-to-r from-[#FFFBEB] to-white dark:from-[#F59E0B]/10 dark:to-[#1E293B]',
      )}
    >
      <span
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          claimed
            ? 'bg-[#F0FDF4] text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]'
            : 'bg-[#F59E0B] text-white',
        )}
      >
        {claimed ? <CheckCircle2 size={18} /> : <Gift size={18} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0F172A] dark:text-white">
          {claimed ? 'Daily bonus claimed' : `Daily bonus: ${rwf(bonus.amount)}`}
        </p>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          {error
            ? error
            : claimed
              ? 'Come back tomorrow to keep your streak going.'
              : `Day ${bonus.streakDay} of your streak. Extra bonus on days 7, 14 and 30.`}
        </p>
      </div>
      {!claimed && (
        <button
          type="button"
          onClick={claim}
          disabled={claiming}
          className="shrink-0 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          {claiming && <Loader2 size={14} className="animate-spin" />}
          Claim
        </button>
      )}
    </section>
  );
}
