// src/app/admin/payments/page.tsx
//
// Review queue for plans paid by mobile money: compare each submission with
// the MoMo statement, then approve (activates the plan) or reject.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ExternalLink, Loader2, Settings, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_MONEY_PROVIDERS, formatRwandaPhone } from '@/lib/constants/payouts';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Row {
  id: string;
  status: Status;
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  provider: 'MTN' | 'AIRTEL';
  payerPhone: string;
  transactionRef: string;
  proofContentType: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  plan?: { name: string } | null;
  user?: { name: string; email: string; phone: string | null } | null;
}

const TABS: { key: Status; label: string }[] = [
  { key: 'PENDING', label: 'To review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];
const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;
const card = 'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155]';
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });

export default function AdminPlanPaymentsPage() {
  const [tab, setTab] = useState<Status>('PENDING');
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/plan-payments?status=${tab}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setRows(json.payments || []);
      setCounts(json.counts || {});
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, kind: 'approve' | 'reject', reason?: string) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/plan-payments/${id}/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reason ? { reason } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Could not ${kind}`);
      setRejecting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Plan payments</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Check each transaction against your MoMo statement before approving. Approving activates the plan.
          </p>
        </div>
        <Link
          href="/admin/settings/payments"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-2 text-sm font-semibold text-[#0F172A] dark:text-white"
        >
          <Settings size={15} /> MoMo numbers
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border',
              tab === t.key
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1]',
            )}
          >
            {t.label} <span className="opacity-75">({counts[t.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] dark:bg-[#EF4444]/10 p-3 text-sm text-[#B91C1C] dark:text-[#F87171]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#2563EB]" />
        </div>
      ) : rows.length === 0 ? (
        <div className={cn(card, 'p-10 text-center text-sm text-[#64748B] dark:text-[#94A3B8]')}>
          {tab === 'PENDING' ? 'No payments waiting for review.' : 'Nothing here yet.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className={cn(card, 'p-4')}>
              <div className="flex flex-col gap-4 md:flex-row">
                <a
                  href={`/api/plan-payments/${r.id}/proof`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block h-40 w-full shrink-0 overflow-hidden rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] md:h-36 md:w-28"
                  title="Open proof"
                >
                  {r.proofContentType?.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/plan-payments/${r.id}/proof`} alt="Payment proof" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs font-semibold text-[#64748B]">PDF proof</span>
                  )}
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white">
                    <ExternalLink size={12} />
                  </span>
                </a>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-lg font-extrabold tabular-nums text-[#0F172A] dark:text-white">{rwf(r.amount)}</p>
                    <span className="text-xs text-[#64748B]">{when(r.createdAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                    {r.plan?.name ?? 'Plan'} · {r.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}
                  </p>
                  <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <div><dt className="inline text-[#64748B]">Transaction ID: </dt><dd className="inline font-mono font-semibold text-[#0F172A] dark:text-white select-all">{r.transactionRef}</dd></div>
                    <div><dt className="inline text-[#64748B]">Paid from: </dt><dd className="inline font-semibold text-[#0F172A] dark:text-white">{formatRwandaPhone(r.payerPhone)} · {MOBILE_MONEY_PROVIDERS[r.provider]?.label}</dd></div>
                    <div><dt className="inline text-[#64748B]">Member: </dt><dd className="inline text-[#0F172A] dark:text-white">{r.user?.name ?? '—'}</dd></div>
                    <div className="truncate"><dt className="inline text-[#64748B]">Email: </dt><dd className="inline text-[#0F172A] dark:text-white">{r.user?.email ?? '—'}</dd></div>
                  </dl>
                  {r.status === 'REJECTED' && r.rejectionReason && (
                    <p className="mt-2 text-sm text-[#B91C1C] dark:text-[#F87171]">Reason: {r.rejectionReason}</p>
                  )}

                  {r.status === 'PENDING' && rejecting?.id !== r.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, 'approve')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve &amp; activate
                      </button>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => setRejecting({ id: r.id, reason: '' })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECACA] px-4 py-2 text-sm font-bold text-[#DC2626] disabled:opacity-60"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                  {rejecting?.id === r.id && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        autoFocus
                        value={rejecting.reason}
                        onChange={(e) => setRejecting({ id: r.id, reason: e.target.value })}
                        placeholder="Reason shown to the member (e.g. amount not received)"
                        className="flex-1 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3 py-2 text-sm outline-none focus:border-[#DC2626]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={rejecting.reason.trim().length < 3 || busy === r.id}
                          onClick={() => act(r.id, 'reject', rejecting.reason.trim())}
                          className="rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button type="button" onClick={() => setRejecting(null)} className="px-3 py-2 text-sm font-semibold text-[#64748B]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
