// src/components/landing/Hero.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  PlayCircle,
  Gamepad2,
  ClipboardCheck,
  Smartphone,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { PAYOUT_TIME_LABEL } from '@/lib/constants/payouts';

const TASKS = [
  { icon: PlayCircle, label: 'Watch sponsored videos', color: 'bg-primary' },
  { icon: Gamepad2, label: 'Play games', color: 'bg-emerald-500' },
  { icon: ClipboardCheck, label: 'Take surveys', color: 'bg-amber-500' },
];

export function Hero() {
  return (
    <section className="relative flex items-center bg-gradient-to-br from-navy via-navy-light to-navy overflow-hidden pt-24 lg:pt-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 rounded-full px-4 py-1.5 mb-6 text-[11px] font-bold text-gold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              Free to join
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-5">
              Earn real money
              <br />
              <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
                doing simple tasks.
              </span>
            </h1>

            <p className="text-white/70 text-base sm:text-lg mb-8 max-w-lg leading-relaxed">
              Watch sponsored videos, play games and take surveys. Withdraw to
              your MTN MoMo or Airtel Money number. Withdrawals are paid every
              day at {PAYOUT_TIME_LABEL}.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-3.5 rounded-full transition-all shadow-lg shadow-gold/30 hover:shadow-gold/50"
              >
                Start earning free <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-medium px-6 py-3.5 rounded-full hover:bg-white/10 transition-all hover:border-white/40"
              >
                How it works
              </a>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-white/60 text-sm">
              <li className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gold" /> Paid to mobile
                money
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" /> Daily payouts at{' '}
                {PAYOUT_TIME_LABEL}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold" /> No fees
              </li>
            </ul>
          </motion.div>

          {/* Illustration: a day of tasks -> payout */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-5 sm:p-6">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                Today&apos;s tasks
              </p>
              <ul className="space-y-3 mb-5">
                {TASKS.map(({ icon: Icon, label, color }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3"
                  >
                    <span
                      className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <span className="text-sm font-semibold text-navy flex-1">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      Earn
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl bg-navy text-white p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-navy" />
                </span>
                <div>
                  <p className="text-sm font-bold">Withdraw to mobile money</p>
                  <p className="text-xs text-white/60">
                    Paid daily at {PAYOUT_TIME_LABEL}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
