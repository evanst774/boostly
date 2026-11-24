// src/components/landing/FinalCTA.tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PAYOUT_TIME_LABEL } from '@/lib/constants/payouts';
import { useT } from '@/lib/i18n';
import { landing } from '@/lib/i18n/messages/landing';

export function FinalCTA() {
  const t = useT(landing);
  return (
    <section className="bg-navy px-4 sm:px-6 pb-20">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-gold px-6 py-12 sm:px-14 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[40px] border-white/20"
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="font-rebond-bold text-3xl sm:text-5xl tracking-[-0.02em] text-[#111827]">
              {t('ctaTitle')}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#111827]/70">
              {t('ctaBody', { time: t('payoutClock', { time: PAYOUT_TIME_LABEL }) })}
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#111827] px-8 py-4 text-[15px] font-bold text-white hover:bg-black transition-colors"
          >
            {t('startEarningFree')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
