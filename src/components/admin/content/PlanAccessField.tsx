// src/components/admin/content/PlanAccessField.tsx
//
// "Available to" picker for videos, games and surveys: every plan, or only the
// plans the admin ticks. Members on other plans don't see the item, and the
// server refuses to start or pay it for them.
'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanOption {
  tier: string;
  name: string;
  priceMonthly: number;
  isActive: boolean;
}

export function PlanAccessField({
  value,
  onChange,
  className,
}: {
  /** Plan keys, or null/[] for every plan. */
  value: string[] | null | undefined;
  onChange: (next: string[] | null) => void;
  className?: string;
}) {
  const [plans, setPlans] = useState<PlanOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = value ?? [];
  const everyone = selected.length === 0;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/subscriptions/plans?all=1', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load plans'))))
      .then((j) => !cancelled && setPlans((j.plans ?? []) as PlanOption[]))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load plans'));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (tier: string) => {
    const next = selected.includes(tier) ? selected.filter((t) => t !== tier) : [...selected, tier];
    onChange(next.length ? next : null);
  };

  return (
    <div className={cn('sm:col-span-2', className)}>
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] dark:text-white">
        <Crown size={15} className="text-[#F59E0B]" /> Available to
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Plans that can use this item">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={everyone}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            everyone
              ? 'border-[#2563EB] bg-[#2563EB] text-white'
              : 'border-[#E2E8F0] text-[#475569] hover:border-[#2563EB] dark:border-[#334155] dark:text-[#CBD5E1]',
          )}
        >
          {everyone && <Check size={13} />} All plans
        </button>
        {plans === null && !error && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <Loader2 size={13} className="animate-spin" /> Loading plans…
          </span>
        )}
        {plans?.map((p) => {
          const on = selected.includes(p.tier);
          return (
            <button
              key={p.tier}
              type="button"
              onClick={() => toggle(p.tier)}
              aria-pressed={on}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                on
                  ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#92400E] dark:bg-[#F59E0B]/15 dark:text-[#FCD34D]'
                  : 'border-[#E2E8F0] text-[#475569] hover:border-[#F59E0B] dark:border-[#334155] dark:text-[#CBD5E1]',
                !p.isActive && 'opacity-60',
              )}
              title={p.isActive ? undefined : 'This plan is hidden from members'}
            >
              {on && <Check size={13} />}
              {p.name.replace(/ Plan$/, '')}
              <span className="font-normal opacity-70">
                {p.priceMonthly > 0 ? `${p.priceMonthly.toLocaleString()} RWF` : 'Free'}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-[#DC2626]">{error}</p>}
      <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
        {everyone
          ? 'Every member can see and earn from this, including Free.'
          : `Only members on ${selected.length === 1 ? 'this plan' : 'these plans'} see it and can earn from it. Others won't see it, and the server refuses it for them.`}
      </p>
    </div>
  );
}
