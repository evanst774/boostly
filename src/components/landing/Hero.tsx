// src/components/landing/Hero.tsx
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Gamepad2,
  PlayCircle,
  Smartphone,
} from 'lucide-react';
import { PayoutCountdown } from '@/components/earn/PayoutCountdown';
import { MIN_WITHDRAWAL, PAYOUT_TIME_LABEL } from '@/lib/constants/payouts';
import type { LandingData } from '@/lib/landing/data';

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

/**
 * Dark, cinematic opening. The card on the right uses real reward amounts
 * from live content (never invented earnings) and a live payout countdown.
 */
export function Hero({ data }: { data: LandingData }) {
  const sample = [
    {
      icon: PlayCircle,
      label: data.videos[0]?.title ?? 'Watch a sponsored video',
      kind: 'Video',
      reward: data.videos[0]?.reward,
      done: true,
    },
    {
      icon: Gamepad2,
      label: data.games[0]?.name ?? 'Play a quick game',
      kind: 'Game',
      reward: data.games[0]?.reward,
      done: true,
    },
    {
      icon: ClipboardCheck,
      label: data.surveys[0]?.title ?? 'Answer a short survey',
      kind: 'Survey',
      reward: data.surveys[0]?.reward,
      done: false,
    },
  ];

  return (
    <section id="top" className="relative overflow-hidden bg-[#070B14] pt-24 sm:pt-32 pb-14">
      {/* Soft light, not blobs: one wide glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(60%_60%_at_30%_30%,rgba(37,99,235,0.28),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-20 h-[420px] w-[520px] bg-[radial-gradient(50%_50%_at_60%_40%,rgba(251,191,36,0.12),transparent_70%)]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-12 lg:gap-16 items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Free to join · Paid to MTN MoMo &amp; Airtel Money
          </p>

          <h1 className="mt-6 font-rebond-bold text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl tracking-[-0.02em] text-white">
            Watch. Play. Answer.
            <span className="block text-gold">Get paid every day.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/65">
            Boostly pays you in RWF for sponsored videos, quick games and short
            surveys. Cash out to your mobile money. Every withdrawal is sent at{' '}
            {PAYOUT_TIME_LABEL}.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold hover:bg-gold-hover px-7 py-3.5 text-[15px] font-bold text-[#111827] transition-colors"
            >
              Start earning free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3.5 text-[15px] font-semibold text-white hover:bg-white/[0.06] transition-colors"
            >
              See how it works
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-3 max-w-lg divide-x divide-white/10 border-y border-white/10">
            {[
              { k: 'Payout time', v: PAYOUT_TIME_LABEL },
              { k: 'Minimum', v: rwf(MIN_WITHDRAWAL) },
              { k: 'Fees', v: 'None' },
            ].map((s) => (
              <div key={s.k} className="py-4 px-3 first:pl-0">
                <dt className="text-[11px] uppercase tracking-wider text-white/40">{s.k}</dt>
                <dd className="mt-1 text-sm sm:text-base font-semibold text-white">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product card */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_40px_120px_-40px_rgba(37,99,235,0.6)]">
            <div className="rounded-[22px] bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  2 of 3 done
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {sample.map(({ icon: Icon, label, kind, reward, done }) => (
                  <li key={kind} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-400">{kind}</p>
                      <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
                    </div>
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : reward ? (
                      <span className="shrink-0 text-xs font-bold text-slate-900">+{rwf(reward)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-slate-900">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Withdraw to mobile money</p>
                    <p className="text-xs text-white/55">MTN MoMo or Airtel Money</p>
                  </div>
                </div>
                <PayoutCountdown tone="dark" className="mt-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
