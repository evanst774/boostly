// src/components/landing/HowItWorks.tsx
import Link from 'next/link';
import { ArrowRight, UserPlus, ListChecks, Smartphone, Banknote } from 'lucide-react';
import { PAYOUT_TIME_LABEL } from '@/lib/constants/payouts';

const STEPS = [
  {
    title: 'Create a free account',
    desc: 'Sign up in under a minute. It costs nothing to join.',
    icon: UserPlus,
    color: 'bg-primary',
  },
  {
    title: 'Complete your daily tasks',
    desc: 'Watch sponsored videos, play games and answer surveys. Money is added to your balance after each task.',
    icon: ListChecks,
    color: 'bg-emerald-500',
  },
  {
    title: 'Request a withdrawal',
    desc: 'Enter the amount and the MTN MoMo or Airtel Money number you want to be paid on.',
    icon: Smartphone,
    color: 'bg-amber-500',
  },
  {
    title: `Get paid at ${PAYOUT_TIME_LABEL}`,
    desc: `All withdrawals are processed every day at ${PAYOUT_TIME_LABEL} and sent to your mobile money account.`,
    icon: Banknote,
    color: 'bg-pink-500',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-bg scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-gold text-xs font-bold tracking-widest uppercase mb-2">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-navy mb-3">
            From task to <span className="text-gold">mobile money</span>
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Four steps from signing up to getting paid.
          </p>
        </div>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map(({ title, desc, icon: Icon, color }, i) => (
            <li
              key={title}
              className="relative rounded-3xl bg-white border border-gray-100 p-6 shadow-sm"
            >
              <span className="absolute top-5 right-5 w-7 h-7 rounded-full bg-navy text-gold text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span
                className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}
              >
                <Icon className="w-6 h-6 text-white" />
              </span>
              <h3 className="font-bold text-navy text-base mb-1">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-3 rounded-full transition-all shadow-gold"
          >
            Start earning free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
