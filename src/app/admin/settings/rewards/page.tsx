// src/app/admin/settings/rewards/page.tsx
//
// Where the money for task rewards comes from: the platform's daily reward
// budget (set from real revenue) and each sponsor campaign's budget.
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  kind: string;
  title: string;
  budget: number;
  spent: number;
  remaining: number;
}
interface Status {
  dailyRewardBudget: number | null;
  spentToday: number;
  remainingToday: number | null;
  campaigns: Campaign[];
}

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;
const card = 'rounded-2xl border border-[#F1F5F9] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5';

export default function RewardBudgetPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = (s: Status) => {
    setStatus(s);
    setValue(s.dailyRewardBudget === null ? '' : String(s.dailyRewardBudget));
  };

  useEffect(() => {
    fetch('/api/admin/settings/reward-budget', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to load');
        apply(j);
      })
      .catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/settings/reward-budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyRewardBudget: value.trim() === '' ? null : Number(value) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not save');
      apply(j);
      setMsg({ ok: true, text: 'Saved. Rewards stop for the day once this amount has been paid.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save' });
    } finally {
      setSaving(false);
    }
  };

  if (!status) {
    return msg ? <p className="text-sm text-[#DC2626]">{msg.text}</p> : <Loader2 className="animate-spin text-[#2563EB]" />;
  }

  const pct =
    status.dailyRewardBudget && status.dailyRewardBudget > 0
      ? Math.min(100, (status.spentToday / status.dailyRewardBudget) * 100)
      : 0;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Reward budget</h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Members are only paid from money Boostly actually has: sponsor campaign budgets and this daily
          budget, set from real advertising, sponsorship and plan revenue.
        </p>
      </div>

      {status.dailyRewardBudget === null && (
        <div className="flex gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] dark:bg-[#F59E0B]/10 p-4 text-sm text-[#92400E] dark:text-[#FBBF24]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          No daily budget is set, so task rewards have no overall limit. Set one from what you actually earn.
        </div>
      )}

      <section className={card}>
        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Today (Kigali time)</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p className="text-2xl font-extrabold tabular-nums text-[#0F172A] dark:text-white">{rwf(status.spentToday)}</p>
          <p className="text-sm text-[#64748B]">
            paid of {status.dailyRewardBudget === null ? 'no limit' : rwf(status.dailyRewardBudget)}
            {status.remainingToday !== null && ` · ${rwf(status.remainingToday)} left`}
          </p>
        </div>
        {status.dailyRewardBudget !== null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F1F5F9] dark:bg-[#334155]">
            <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-[#EF4444]' : 'bg-[#2563EB]')} style={{ width: `${pct}%` }} />
          </div>
        )}

        <label className="mt-5 block text-sm font-semibold text-[#0F172A] dark:text-white">Daily reward budget (RWF)</label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 50000"
            className="flex-1 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm outline-none focus:border-[#2563EB]"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />} Save
          </button>
        </div>
        <p className="mt-1 text-xs text-[#64748B]">
          Covers videos, games, surveys, ads and the daily bonus. Referral commissions are paid from plan fees
          and aren&apos;t counted here. Leave empty for no limit.
        </p>
        {msg && <p className={cn('mt-2 text-sm', msg.ok ? 'text-[#16A34A]' : 'text-[#DC2626]')}>{msg.text}</p>}
      </section>

      <section className={card}>
        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Sponsor campaigns</p>
        <p className="text-xs text-[#64748B]">Set a budget on any video, game or survey from its edit page.</p>
        {status.campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-[#64748B]">No campaign budgets yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#F1F5F9] dark:divide-[#334155]">
            {status.campaigns.map((c) => {
              const used = c.budget > 0 ? Math.min(100, (c.spent / c.budget) * 100) : 100;
              return (
                <li key={`${c.kind}-${c.id}`} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                      <span className="mr-2 text-xs font-medium text-[#64748B]">{c.kind}</span>
                      {c.title}
                    </p>
                    <p className={cn('shrink-0 text-xs font-semibold tabular-nums', c.remaining === 0 ? 'text-[#DC2626]' : 'text-[#475569] dark:text-[#CBD5E1]')}>
                      {c.remaining === 0 ? 'Used up' : `${rwf(c.remaining)} left`}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#F1F5F9] dark:bg-[#334155]">
                    <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${used}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                    {rwf(c.spent)} paid of {rwf(c.budget)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
