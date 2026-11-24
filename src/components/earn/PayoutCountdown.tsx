// src/components/earn/PayoutCountdown.tsx
'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getNextPayoutAt } from '@/lib/constants/payouts';
import { useT } from '@/lib/i18n';
import { usePayoutText, wallet } from '@/lib/i18n/messages/wallet';
import { cn } from '@/lib/utils';

/** "Next payout: Today at 3:00 PM · in 2h 14m", ticking every 30s. */
export function PayoutCountdown({
  className,
  tone = 'light',
}: {
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const [now, setNow] = useState<Date | null>(null);
  const t = useT(wallet);
  const { payoutDay, countdown } = usePayoutText();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Render nothing until mounted so server and client markup match.
  if (!now) return <span className={cn('inline-block h-4', className)} />;

  const payoutAt = getNextPayoutAt(now);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        tone === 'dark'
          ? 'text-white/80'
          : 'text-[#475569] dark:text-[#94A3B8]',
        className,
      )}
    >
      <Clock size={13} className="shrink-0" />
      {t('nextPayout', { when: payoutDay(payoutAt, now).toLowerCase() })} ·{' '}
      <span className="font-bold tabular-nums">
        {t('inTime', { time: countdown(payoutAt.getTime() - now.getTime()) })}
      </span>
    </span>
  );
}
