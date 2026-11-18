// src/components/landing/Payouts.tsx
import { CheckCircle2, Smartphone } from 'lucide-react';
import { PAYOUT_TIME_LABEL, PAYOUT_TIMEZONE } from '@/lib/constants/payouts';
import type { LandingStats, RecentPayout } from '@/lib/landing/data';

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString('en-US');
}

/**
 * Social proof from real data only. Stats with no activity yet are hidden
 * rather than padded, and member names are masked ("Jean N.").
 */
export function Payouts({
  stats,
  payouts,
}: {
  stats: LandingStats;
  payouts: RecentPayout[];
}) {
  const figures = [
    { k: 'Members', v: compact(stats.members), show: stats.members > 0 },
    { k: 'Tasks completed', v: compact(stats.tasksCompleted), show: stats.tasksCompleted > 0 },
    { k: 'Rewards earned', v: `${compact(stats.rewardsPaid)} RWF`, show: stats.rewardsPaid > 0 },
    { k: 'Paid to mobile money', v: `${compact(stats.withdrawn)} RWF`, show: stats.withdrawn > 0 },
  ].filter((f) => f.show);

  return (
    <section id="payouts" className="bg-slate-50 py-20 sm:py-28 scroll-mt-16 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Payouts</p>
          <h2 className="mt-2 font-rebond-bold text-3xl sm:text-5xl tracking-[-0.02em] text-slate-900">
            Real people, paid every day.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            All withdrawal requests are paid together at {PAYOUT_TIME_LABEL},
            Kigali time, straight to the member&apos;s mobile money number.
          </p>

          {figures.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8">
              {figures.map((f) => (
                <div key={f.k} className="border-l-2 border-slate-900 pl-4">
                  <dd className="font-rebond-bold text-3xl sm:text-4xl tracking-tight text-slate-900 tabular-nums">
                    {f.v}
                  </dd>
                  <dt className="mt-1 text-sm text-slate-500">{f.k}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-sm font-semibold text-slate-900">Recent payouts</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Mobile money
            </span>
          </div>
          {payouts.length === 0 ? (
            <div className="m-2 rounded-2xl bg-slate-50 p-6 text-center">
              <Smartphone className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                The next payout run is today at {PAYOUT_TIME_LABEL}.
              </p>
              <p className="text-xs text-slate-500">Completed payouts appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {payouts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: PAYOUT_TIMEZONE,
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-slate-900">{rwf(p.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
