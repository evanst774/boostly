// src/app/(dashboard)/wallet/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Eye, EyeOff, RefreshCw, Smartphone } from 'lucide-react';
import { useEarnToday } from '@/hooks/useEarnToday';
import { PayoutCountdown } from '@/components/earn/PayoutCountdown';
import { LedgerRow } from '@/components/earn/LedgerRow';
import { PAYOUT_TIME_LABEL, formatRwandaPhone } from '@/lib/constants/payouts';
import { cn } from '@/lib/utils';

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;
const card =
  'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]';

interface WithdrawalRow {
  id: string;
  amount: number;
  phoneNumber: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

const STATUS_UI: Record<WithdrawalRow['status'], { label: string; cls: string }> = {
  PENDING: { label: `Paid at ${PAYOUT_TIME_LABEL}`, cls: 'bg-[#FFFBEB] text-[#B45309] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]' },
  PROCESSING: { label: 'Sending', cls: 'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-[#2563EB]/15 dark:text-[#93C5FD]' },
  COMPLETED: { label: 'Paid', cls: 'bg-[#F0FDF4] text-[#15803D] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]' },
  FAILED: { label: 'Refunded', cls: 'bg-[#FEF2F2] text-[#B91C1C] dark:bg-[#EF4444]/15 dark:text-[#F87171]' },
};

export default function WalletPage() {
  const { data, isLoading, error, refetch } = useEarnToday();
  const [hidden, setHidden] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);

  useEffect(() => {
    fetch('/api/wallet/withdrawals?limit=10', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { withdrawals: [] }))
      .then((j) => setWithdrawals(j.withdrawals || []))
      .catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto font-outfit">
        <div className="h-48 rounded-2xl animate-pulse bg-[#F1F5F9] dark:bg-[#1E293B]" />
        <div className="h-64 rounded-2xl animate-pulse bg-[#F1F5F9] dark:bg-[#1E293B]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn(card, 'p-8 text-center font-outfit')}>
        <p className="text-sm text-[#64748B] mb-3">{error || 'Something went wrong.'}</p>
        <button type="button" onClick={refetch} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]">
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  const { wallet, withdrawal, earnings } = data;

  return (
    <div className="space-y-4 sm:space-y-5 pb-4 max-w-3xl mx-auto font-outfit">
      {/* Balance */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#2563EB] p-5 sm:p-6 text-white">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-white/75 hover:text-white"
          >
            Available to withdraw {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums mt-1">
            {hidden ? '••••••' : rwf(wallet.balance)}
          </p>

          <dl className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/15 text-sm">
            <div>
              <dt className="text-[11px] text-white/65">On its way</dt>
              <dd className="font-bold tabular-nums">{rwf(wallet.pendingWithdrawal)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-white/65">Withdrawn</dt>
              <dd className="font-bold tabular-nums">{rwf(wallet.totalWithdrawn)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-white/65">Earned today</dt>
              <dd className="font-bold tabular-nums">{rwf(earnings.today)}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <PayoutCountdown tone="dark" />
            <Link
              href="/wallet/withdraw"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1E3A8A] text-sm font-bold px-5 py-3 rounded-xl hover:bg-white/90 transition-colors"
            >
              <Smartphone size={16} /> Withdraw
            </Link>
          </div>
        </div>
      </section>

      {/* Plan rule */}
      <div className={cn(card, 'p-4 flex items-center gap-3')}>
        <span className="w-9 h-9 rounded-xl bg-[#FFFBEB] dark:bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
          <Crown size={16} />
        </span>
        <p className="flex-1 text-sm text-[#475569] dark:text-[#CBD5E1]">
          <span className="font-semibold text-[#0F172A] dark:text-white">
            {withdrawal.plan.isFree ? 'Free plan' : withdrawal.plan.name}:
          </span>{' '}
          withdraw {withdrawal.frequencyLabel.toLowerCase()}, paid at {PAYOUT_TIME_LABEL}.
        </p>
        {withdrawal.plan.isFree && (
          <Link href="/plans" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] shrink-0">
            Upgrade
          </Link>
        )}
      </div>

      {/* Withdrawals */}
      <section className={cn(card, 'p-4 sm:p-5')}>
        <h2 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Withdrawals</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-6 text-center">
            No withdrawals yet. Once you have {rwf(withdrawal.minAmount)}, you can cash out.
          </p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9] dark:divide-[#334155]/60">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tabular-nums text-[#0F172A] dark:text-white">{rwf(w.amount)}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    {formatRwandaPhone(w.phoneNumber)} ·{' '}
                    {new Date(w.completedAt || w.requestedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {w.status === 'FAILED' && w.failureReason ? ` · ${w.failureReason}` : ''}
                  </p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg shrink-0', STATUS_UI[w.status]?.cls)}>
                  {STATUS_UI[w.status]?.label ?? w.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activity */}
      <section className={cn(card, 'p-4 sm:p-5')}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Recent activity</h2>
          <div className="flex gap-3">
            <Link href="/wallet/earnings" className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              Earnings
            </Link>
            <Link href="/wallet/history" className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              All history
            </Link>
          </div>
        </div>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-6 text-center">
            No activity yet. <Link href="/dashboard" className="text-[#2563EB] font-semibold">Start a task</Link>
          </p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9] dark:divide-[#334155]/60">
            {data.recentTransactions.map((tx) => (
              <LedgerRow key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
