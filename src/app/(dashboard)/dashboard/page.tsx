// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  PlayCircle,
  RefreshCw,
  Smartphone,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEarnToday, type TaskProgress } from '@/hooks/useEarnToday';
import { PayoutCountdown } from '@/components/earn/PayoutCountdown';
import { LedgerRow } from '@/components/earn/LedgerRow';
import { DailyBonusCard } from '@/components/earn/DailyBonusCard';
import { cn } from '@/lib/utils';

const rwf = (n: number) =>
  `${Math.round(n).toLocaleString('en-US')} RWF`;

const TASK_STYLE: Record<
  TaskProgress['key'],
  { icon: typeof PlayCircle; tint: string; bar: string }
> = {
  videos: {
    icon: PlayCircle,
    tint: 'bg-[#EFF6FF] text-[#2563EB] dark:bg-[#2563EB]/15 dark:text-[#60A5FA]',
    bar: 'bg-[#2563EB]',
  },
  games: {
    icon: Gamepad2,
    tint: 'bg-[#F0FDF4] text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]',
    bar: 'bg-[#22C55E]',
  },
  surveys: {
    icon: ClipboardCheck,
    tint: 'bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#8B5CF6]/15 dark:text-[#A78BFA]',
    bar: 'bg-[#8B5CF6]',
  },
};

const card =
  'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]';

// ─── Skeleton ─────────────────────────────────────────────────────
function Skeleton() {
  const b = 'animate-pulse rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B]';
  return (
    <div className="space-y-4 font-outfit">
      <div className={`${b} h-10 w-48`} />
      <div className={`${b} h-44`} />
      <div className={`${b} h-56`} />
      <div className={`${b} h-40`} />
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────
function TaskRow({ task }: { task: TaskProgress }) {
  const style = TASK_STYLE[task.key];
  const Icon = style.icon;
  const finished = task.remaining === 0;
  const pct = task.limit > 0 ? Math.min(100, (task.done / task.limit) * 100) : 0;

  return (
    <Link
      href={task.href}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors',
        finished
          ? 'opacity-70'
          : 'hover:border-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:border-[#334155] dark:hover:bg-[#0F172A]/40',
      )}
    >
      <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', style.tint)}>
        <Icon size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
            {task.label}
          </p>
          <span className="text-xs font-semibold tabular-nums text-[#64748B] dark:text-[#94A3B8] shrink-0">
            {task.done}/{task.limit}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#334155] overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', style.bar)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {finished ? (
        <CheckCircle2 size={20} className="text-[#22C55E] shrink-0" />
      ) : (
        <span className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] shrink-0 flex items-center">
          Start <ChevronRight size={14} />
        </span>
      )}
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useEarnToday();
  const [hidden, setHidden] = useState(false);


  if (isLoading) return <Skeleton />;

  if (error || !data) {
    return (
      <div className={cn(card, 'p-8 text-center font-outfit')}>
        <p className="text-sm text-[#64748B] mb-3">{error || 'Something went wrong.'}</p>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  const { plan, tasks, totals, wallet, earnings, withdrawal, streak } = data;
  const firstName = (user?.name || '').split(' ')[0] || 'there';
  const allDone = totals.limit > 0 && totals.done >= totals.limit;
  const totalPct = totals.limit > 0 ? Math.round((totals.done / totals.limit) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-5 pb-4 font-outfit max-w-4xl mx-auto">
      {/* Greeting */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-white truncate">
            Hi, {firstName} 👋
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {allDone ? 'All tasks done for today. Great work!' : 'Complete your tasks to grow your balance.'}
          </p>
        </div>
        <Link
          href="/plans"
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors',
            plan.isFree
              ? 'border-[#F59E0B]/40 bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7] dark:bg-[#F59E0B]/10 dark:text-[#FBBF24]'
              : 'border-[#2563EB]/30 bg-[#EFF6FF] text-[#1D4ED8] dark:bg-[#2563EB]/15 dark:text-[#93C5FD]',
          )}
        >
          <Crown size={13} />
          {plan.isFree ? 'Free · Upgrade' : plan.name.replace(/ Plan$/, '')}
        </Link>
      </header>

      {/* Balance + withdraw */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#2563EB] p-5 sm:p-6 text-white">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <button
              type="button"
              onClick={() => setHidden((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-white/75 hover:text-white"
            >
              Available balance {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums mt-1">
              {hidden ? '••••••' : rwf(wallet.balance)}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">
                +{rwf(earnings.today)} today
              </span>
              {streak.current > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
                  <Flame size={12} /> {streak.current}-day streak
                </span>
              )}
              {wallet.pendingWithdrawal > 0 && (
                <span className="inline-flex items-center gap-1 bg-white/10 text-white/85 px-2 py-0.5 rounded-full">
                  {rwf(wallet.pendingWithdrawal)} on the way
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <Link
              href="/wallet/withdraw"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1E3A8A] text-sm font-bold px-5 py-3 rounded-xl hover:bg-white/90 transition-colors"
            >
              <Smartphone size={16} /> Withdraw to mobile money
            </Link>
            <PayoutCountdown tone="dark" />
          </div>
        </div>
        {!withdrawal.canWithdraw && withdrawal.reason && (
          <p className="relative mt-4 text-xs text-white/75 border-t border-white/10 pt-3">
            {withdrawal.reason}
          </p>
        )}
      </section>

      {data.dailyBonus && (
        <DailyBonusCard bonus={data.dailyBonus} onClaimed={refetch} />
      )}


      {/* Today's tasks */}
      <section className={cn(card, 'p-4 sm:p-5')}>
        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Today&apos;s tasks</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {totals.done} of {totals.limit} done · new tasks every day
            </p>
          </div>
          <span className="text-lg font-extrabold text-[#2563EB] dark:text-[#60A5FA] tabular-nums">
            {totalPct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#F1F5F9] dark:bg-[#334155] overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#22C55E] transition-all"
            style={{ width: `${totalPct}%` }}
          />
        </div>
        <div className="-mx-1 divide-y divide-[#F1F5F9] dark:divide-[#334155]/60">
          {tasks.map((t) => (
            <TaskRow key={t.key} task={t} />
          ))}
        </div>
      </section>

      {/* Upgrade nudge for free users */}
      {plan.isFree && (
        <Link
          href="/plans"
          className="flex items-center gap-3 rounded-2xl border border-[#F59E0B]/30 bg-gradient-to-r from-[#FFFBEB] to-white dark:from-[#F59E0B]/10 dark:to-[#1E293B] p-4 hover:border-[#F59E0B] transition-colors"
        >
          <span className="w-10 h-10 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">
              Earn more and withdraw every day
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Free plan: more tasks unlock with an upgrade, and withdrawals are once a week.
            </p>
          </div>
          <ChevronRight size={18} className="text-[#B45309] shrink-0" />
        </Link>
      )}

      {/* Summary + activity */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        <section className={cn(card, 'p-4 sm:p-5 lg:col-span-2')}>
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Your earnings</h2>
          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: 'Today', value: earnings.today },
              { label: 'Last 7 days', value: earnings.week },
              { label: 'Last 30 days', value: earnings.month },
              { label: 'Withdrawn', value: wallet.totalWithdrawn },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A]/40 p-3">
                <dt className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{s.label}</dt>
                <dd className="text-sm font-bold tabular-nums text-[#0F172A] dark:text-white mt-0.5">
                  {rwf(s.value)}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            href="/wallet"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]"
          >
            <Wallet size={14} /> Open wallet
          </Link>
        </section>

        <section className={cn(card, 'p-4 sm:p-5 lg:col-span-3')}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Recent activity</h2>
            <Link href="/wallet/history" className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              View all
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-6 text-center">
              No activity yet. Start with a task above.
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
    </div>
  );
}
