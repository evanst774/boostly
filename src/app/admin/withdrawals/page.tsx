// src/app/admin/withdrawals/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  Clipboard,
  ClipboardCheck,
  Clock,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PayoutCountdown } from '@/components/earn/PayoutCountdown';
import {
  MOBILE_MONEY_PROVIDERS,
  PAYOUT_TIME_LABEL,
  formatRwandaPhone,
  type MobileMoneyProvider,
} from '@/lib/constants/payouts';

interface WithdrawalSummary {
  id: string;
  userName: string;
  userEmail: string | null;
  amount: number;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  date: string;
  phoneNumber: string | null;
  accountName: string | null;
  provider: MobileMoneyProvider | null;
  failureReason: string | null;
  completedAt: string | null;
  reference: string | null;
}

type Tab = 'PENDING' | 'COMPLETED' | 'FAILED';
const TABS: { key: Tab; label: string }[] = [
  { key: 'PENDING', label: `To pay at ${PAYOUT_TIME_LABEL}` },
  { key: 'COMPLETED', label: 'Paid' },
  { key: 'FAILED', label: 'Rejected' },
];

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;
const card =
  'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155]';

export default function AdminWithdrawalsPage() {
  const [tab, setTab] = useState<Tab>('PENDING');
  const [rows, setRows] = useState<WithdrawalSummary[]>([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${tab}&limit=500`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setRows(data.withdrawals || []);
      if (data.stats) setStats(data.stats);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    const res = await fetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to mark as paid');
  };

  const markPaid = async (id: string) => {
    setBusyId(id);
    try {
      await approve(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!rejecting || !rejecting.reason.trim()) return;
    setBusyId(rejecting.id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${rejecting.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejecting.reason.trim() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to reject');
      setRejecting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const markAllPaid = async () => {
    setConfirmAll(false);
    const ids = rows.map((r) => r.id);
    setBulkProgress({ done: 0, total: ids.length });
    const failed: string[] = [];
    for (const [i, id] of ids.entries()) {
      try {
        await approve(id);
      } catch {
        failed.push(id);
      }
      setBulkProgress({ done: i + 1, total: ids.length });
    }
    setBulkProgress(null);
    if (failed.length) setError(`${failed.length} payout(s) could not be marked as paid. They are still in the list.`);
    await load();
  };

  const copyList = async () => {
    const lines = rows.map((r) =>
      [formatRwandaPhone(r.phoneNumber), r.accountName ?? '', r.amount, r.provider ?? ''].join('\t'),
    );
    try {
      await navigator.clipboard.writeText(['Phone\tName\tAmount (RWF)\tProvider', ...lines].join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed. Select the rows manually.');
    }
  };

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      !q ||
      r.userName.toLowerCase().includes(q) ||
      (r.accountName ?? '').toLowerCase().includes(q) ||
      (r.phoneNumber ?? '').includes(q.replace(/\s/g, '')),
  );
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byProvider = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.provider ?? 'OTHER';
    acc[k] = (acc[k] ?? 0) + r.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Withdrawals</h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Pay every pending request to the user&apos;s mobile money at {PAYOUT_TIME_LABEL}, then mark it paid.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const count = t.key === 'PENDING' ? stats.pending : t.key === 'COMPLETED' ? stats.completed : stats.failed;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors',
                tab === t.key
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] hover:border-[#2563EB]',
              )}
            >
              {t.label} <span className="opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Payout run summary */}
      {tab === 'PENDING' && !isLoading && (
        <div className={cn(card, 'p-5')}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wide">
                Today&apos;s payout run
              </p>
              <p className="text-3xl font-extrabold text-[#0F172A] dark:text-white tabular-nums mt-1">{rwf(total)}</p>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                {rows.length} request{rows.length === 1 ? '' : 's'}
                {Object.entries(byProvider).map(([k, v]) => (
                  <span key={k}>
                    {' · '}
                    {MOBILE_MONEY_PROVIDERS[k as MobileMoneyProvider]?.label ?? 'Other'} {rwf(v)}
                  </span>
                ))}
              </p>
              <PayoutCountdown className="mt-2" />
            </div>
            {rows.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyList}
                  className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-sm font-semibold flex items-center gap-2 hover:border-[#2563EB]"
                >
                  {copied ? <ClipboardCheck size={16} className="text-[#22C55E]" /> : <Clipboard size={16} />}
                  {copied ? 'Copied' : 'Copy payout list'}
                </button>
                {confirmAll ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#475569] dark:text-[#CBD5E1]">Sent all {rows.length}?</span>
                    <button type="button" onClick={markAllPaid} className="px-4 py-2.5 rounded-xl bg-[#22C55E] text-white text-sm font-bold">
                      Yes, mark paid
                    </button>
                    <button type="button" onClick={() => setConfirmAll(false)} className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#64748B]">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!!bulkProgress}
                    onClick={() => setConfirmAll(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#22C55E] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60"
                  >
                    {bulkProgress ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {bulkProgress ? `Marking ${bulkProgress.done}/${bulkProgress.total}…` : 'Mark all as paid'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] dark:bg-[#EF4444]/10 p-3 text-sm text-[#B91C1C] dark:text-[#F87171] flex justify-between gap-3">
          {error}
          <button type="button" onClick={() => setError(null)} className="font-semibold">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="search"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] dark:border-[#334155] rounded-xl outline-none focus:border-[#2563EB] text-sm bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#2563EB]" />
        </div>
      ) : visible.length === 0 ? (
        <div className={cn(card, 'p-10 text-center')}>
          <Clock size={28} className="mx-auto text-[#94A3B8] mb-2" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {tab === 'PENDING' ? 'Nothing to pay. All requests are processed.' : 'Nothing here yet.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((w) => (
            <li key={w.id} className={cn(card, 'p-4')}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-base font-bold text-[#0F172A] dark:text-white tabular-nums">
                    {formatRwandaPhone(w.phoneNumber) || '—'}
                    {w.provider && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1] align-middle">
                        {MOBILE_MONEY_PROVIDERS[w.provider]?.label}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {w.accountName || 'No name'} · user: {w.userName}
                    {' · '}
                    {new Date(w.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' })}
                  </p>
                  {w.status === 'FAILED' && w.failureReason && (
                    <p className="text-xs text-[#B91C1C] dark:text-[#F87171] mt-0.5">Reason: {w.failureReason}</p>
                  )}
                  {w.status === 'COMPLETED' && w.reference && (
                    <p className="text-xs text-[#64748B] mt-0.5">Ref {w.reference}</p>
                  )}
                </div>
                <p className="text-xl font-extrabold text-[#0F172A] dark:text-white tabular-nums">{rwf(w.amount)}</p>
                {w.status === 'PENDING' && rejecting?.id !== w.id && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === w.id || !!bulkProgress}
                      onClick={() => markPaid(w.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {busyId === w.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Paid
                    </button>
                    <button
                      type="button"
                      disabled={busyId === w.id || !!bulkProgress}
                      onClick={() => setRejecting({ id: w.id, reason: '' })}
                      className="px-3.5 py-2 rounded-xl border border-[#FECACA] text-[#DC2626] text-sm font-bold flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
              {rejecting?.id === w.id && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    autoFocus
                    placeholder="Reason shown to the user (e.g. number not registered)"
                    value={rejecting.reason}
                    onChange={(e) => setRejecting({ id: w.id, reason: e.target.value })}
                    className="flex-1 px-3 py-2 border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] outline-none focus:border-[#DC2626]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!rejecting.reason.trim() || busyId === w.id}
                      onClick={reject}
                      className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-sm font-bold disabled:opacity-50"
                    >
                      Reject &amp; refund
                    </button>
                    <button type="button" onClick={() => setRejecting(null)} className="px-3 py-2 text-sm font-semibold text-[#64748B]">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
