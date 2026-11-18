// src/components/landing/HowItWorks.tsx
import { ListChecks, Smartphone, UserPlus, Wallet } from 'lucide-react';
import {
  MIN_WITHDRAWAL,
  MOBILE_MONEY_PROVIDERS,
  PAYOUT_TIME_LABEL,
} from '@/lib/constants/payouts';

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create a free account',
    body: 'Sign up in under a minute. Joining costs nothing.',
  },
  {
    icon: ListChecks,
    title: 'Complete daily tasks',
    body: 'Watch sponsored videos, play games, answer surveys. Each finished task adds RWF to your balance.',
  },
  {
    icon: Wallet,
    title: 'Request a withdrawal',
    body: `Pick the amount and the mobile money number to pay. The amount is reserved right away.`,
  },
  {
    icon: Smartphone,
    title: `Paid at ${PAYOUT_TIME_LABEL}`,
    body: `Every request is sent in one daily run. Requests after ${PAYOUT_TIME_LABEL} go out the next day.`,
  },
];

/** Light, precise explanation of how money moves. */
export function HowItWorks() {
  const providers = Object.values(MOBILE_MONEY_PROVIDERS)
    .map((p) => p.label)
    .join(' & ');

  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 className="mt-2 font-rebond-bold text-3xl sm:text-5xl tracking-[-0.02em] text-slate-900">
            From a task to your phone, in one day.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            No points to convert, no gift cards. Your balance is in RWF and it
            goes straight to your mobile money.
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
                <p className="text-xs font-semibold text-slate-400">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <dl className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
          {[
            { k: 'Paid to', v: providers },
            { k: 'Payout time', v: `Every day, ${PAYOUT_TIME_LABEL}` },
            { k: 'Minimum withdrawal', v: `${MIN_WITHDRAWAL.toLocaleString()} RWF` },
            { k: 'Withdrawal fee', v: 'Free' },
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
