// src/components/landing/HowItWorks.tsx
'use client';

import { ListChecks, Smartphone, UserPlus, Wallet } from 'lucide-react';
import {
  MIN_WITHDRAWAL,
  MOBILE_MONEY_PROVIDERS,
  PAYOUT_TIME_LABEL,
} from '@/lib/constants/payouts';
import { useFormatNumber, useT } from '@/lib/i18n';
import { common } from '@/lib/i18n/messages/common';
import { landing } from '@/lib/i18n/messages/landing';

const STEPS = [
  { icon: UserPlus, title: 'step1Title', body: 'step1Body' },
  { icon: ListChecks, title: 'step2Title', body: 'step2Body' },
  { icon: Wallet, title: 'step3Title', body: 'step3Body' },
  { icon: Smartphone, title: 'step4Title', body: 'step4Body' },
] as const;

/** Light, precise explanation of how money moves. */
export function HowItWorks() {
  const t = useT(landing);
  const tc = useT(common);
  const fmt = useFormatNumber();
  const time = t('payoutClock', { time: PAYOUT_TIME_LABEL });
  const providers = Object.values(MOBILE_MONEY_PROVIDERS)
    .map((p) => p.label)
    .join(' & ');

  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">{t('navHow')}</p>
          <h2 className="mt-2 font-rebond-bold text-3xl sm:text-5xl tracking-[-0.02em] text-slate-900">
            {t('howTitle')}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t('howBody')}
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          {/* connecting line (desktop) */}
          <div
            aria-hidden
            className="hidden md:block absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"
          />
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex md:block gap-4">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white ring-8 ring-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="md:mt-6">
                <p className="text-xs font-semibold text-slate-400">{t('stepN', { n: i + 1 })}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{t(title, { time })}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{t(body, { time })}</p>
              </div>
            </li>
          ))}
        </ol>

        <dl className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
          {[
            { k: t('paidTo'), v: providers },
            { k: t('payoutTime'), v: t('everyDayAt', { time }) },
            { k: t('minWithdrawal'), v: tc('rwf', { amount: fmt(MIN_WITHDRAWAL) }) },
            { k: t('withdrawalFee'), v: t('free') },
          ].map((r) => (
            <div key={r.k} className="bg-white p-5">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">{r.k}</dt>
              <dd className="mt-1.5 text-base font-semibold text-slate-900">{r.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
