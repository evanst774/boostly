// src/components/admin/tabs/WithdrawalsTab.tsx
//
// Dashboard summary of today's payout run. Paying and rejecting happen on the
// dedicated /admin/withdrawals page, so there is a single place to act.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Loader2 } from 'lucide-react';
import { PayoutCountdown } from '@/components/earn/PayoutCountdown';
import {
  MOBILE_MONEY_PROVIDERS,
  PAYOUT_TIME_LABEL,
  formatRwandaPhone,
  type MobileMoneyProvider,
} from '@/lib/constants/payouts';

interface PendingRow {
  id: string;
  userName: string;
  amount: number;
  phoneNumber: string | null;
  provider: MobileMoneyProvider | null;
}

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

export function WithdrawalsTab() {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/withdrawals?status=PENDING&limit=500', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setRows(data.withdrawals || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={28} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">
            To pay at {PAYOUT_TIME_LABEL}
          </p>
          <p className="text-3xl font-extrabold text-[#0F172A] dark:text-white tabular-nums mt-1">
            {rwf(total)}
          </p>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {rows.length} pending request{rows.length === 1 ? '' : 's'}
          </p>
          <PayoutCountdown className="mt-2" />
        </div>
        <Link
          href="/admin/withdrawals"
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold inline-flex items-center gap-2"
        >
          Open payout run <ArrowRight size={16} />
        </Link>
      </div>

      {error && (
        <p className="text-sm text-[#B91C1C] dark:text-[#F87171]">{error}</p>
      )}

      {rows.length === 0 && !error ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] p-8 text-center">
          <Clock size={24} className="mx-auto text-[#94A3B8] mb-2" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            No pending withdrawals.
          </p>
        </div>
      ) : (
        <ul className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] divide-y divide-[#F1F5F9] dark:divide-[#334155]">
          {rows.slice(0, 8).map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white tabular-nums">
                  {formatRwandaPhone(w.phoneNumber) || '—'}
                  {w.provider && (
                    <span className="ml-2 text-[10px] font-bold text-[#64748B]">
                      {MOBILE_MONEY_PROVIDERS[w.provider]?.label}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">{w.userName}</p>
              </div>
              <p className="text-sm font-bold tabular-nums text-[#0F172A] dark:text-white">
                {rwf(w.amount)}
              </p>
            </li>
          ))}
          {rows.length > 8 && (
            <li className="px-4 py-3 text-xs text-[#64748B]">
              +{rows.length - 8} more on the payout run page
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
