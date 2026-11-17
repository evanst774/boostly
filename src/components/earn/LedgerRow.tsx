// src/components/earn/LedgerRow.tsx
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { LedgerEntry } from '@/hooks/useEarnToday';
import { PAYOUT_TIME_LABEL } from '@/lib/constants/payouts';
import { cn } from '@/lib/utils';

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

/** One wallet ledger line: earnings in green, withdrawals with payout status. */
export function LedgerRow({ tx }: { tx: LedgerEntry }) {
  const credit = tx.type === 'CREDIT';
  const status =
    tx.status === 'PENDING'
      ? { label: `Paid at ${PAYOUT_TIME_LABEL}`, cls: 'text-[#B45309] bg-[#FFFBEB] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]' }
      : tx.status === 'FAILED' || tx.status === 'CANCELLED'
        ? { label: 'Refunded', cls: 'text-[#B91C1C] bg-[#FEF2F2] dark:bg-[#EF4444]/15 dark:text-[#F87171]' }
        : null;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          credit
            ? 'bg-[#F0FDF4] text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]'
            : 'bg-[#F1F5F9] text-[#475569] dark:bg-[#334155] dark:text-[#CBD5E1]',
        )}
      >
        {credit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">
          {tx.description}
        </p>
        <p className="text-[11px] text-[#94A3B8]">
          {new Date(tx.createdAt).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            'text-sm font-bold tabular-nums',
            credit ? 'text-[#16A34A] dark:text-[#4ADE80]' : 'text-[#0F172A] dark:text-white',
          )}
        >
          {credit ? '+' : '−'}
          {rwf(tx.amount)}
        </p>
        {status && (
          <span className={cn('inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5', status.cls)}>
            {status.label}
          </span>
        )}
      </div>
    </li>
  );
}
