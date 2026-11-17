// src/app/(dashboard)/plans/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  Clock,
  Crown,
  Gamepad2,
  ClipboardList,
  Loader2,
  PlayCircle,
  Smartphone,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBadges, type SubscriptionPlan } from '@/hooks/useBadges';
import {
  RECOMMENDED_TIER,
  TIERS,
  TIER_ORDER,
  TIER_PRICES,
} from '@/lib/constants/tiers';
import {
  FREE_WITHDRAWAL_INTERVAL_DAYS,
  PAYOUT_TIME_LABEL,
  describeWithdrawalFrequency,
} from '@/lib/constants/payouts';

type BillingCycle = 'MONTHLY' | 'YEARLY';

interface PlanView {
  id: string | null; // null = fallback plan, not purchasable
  tier: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  dailyEarnings: number;
  videos: number;
  games: number;
  surveys: number;
  features: string[];
}

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

function tierRank(tier: string) {
  const i = (TIER_ORDER as readonly string[]).indexOf(tier);
  return i === -1 ? 99 : i;
}

/** DB plans first; TIERS + fallback prices only if the API returned nothing. */
function buildPlans(apiPlans: SubscriptionPlan[]): PlanView[] {
  const fromApi = apiPlans.map<PlanView>((p) => ({
    id: p.id,
    tier: p.tier,
    name: p.name.replace(/\s*Plan$/i, ''),
    description: p.description ?? TIERS[p.tier]?.description ?? '',
    priceMonthly: p.priceMonthly ?? 0,
    priceYearly: p.priceYearly ?? 0,
    dailyEarnings:
      p.dailyEarnings ?? TIERS[p.tier]?.metadata.estimatedDailyEarnings ?? 0,
    videos: p.maxDailyVideos,
    games: p.maxDailyGames,
    surveys: p.maxDailySurveys,
    features: (p.features ?? []) as string[],
  }));

  const list =
    fromApi.length > 0
      ? fromApi
      : TIER_ORDER.map((tier) => {
          const t = TIERS[tier];
          return {
            id: null,
            tier,
            name: t.label,
            description: t.description,
            priceMonthly: TIER_PRICES[tier].monthly,
            priceYearly: TIER_PRICES[tier].yearly,
            dailyEarnings: t.metadata.estimatedDailyEarnings,
            videos: t.metadata.maxDailyVideos,
            games: t.metadata.maxDailyGames,
            surveys: t.metadata.maxDailySurveys,
            features: t.features,
          };
        });

  // Free is always shown, even if it isn't stored as a DB plan.
  if (!list.some((p) => p.tier === 'FREE')) {
    const t = TIERS.FREE;
    list.push({
      id: null,
      tier: 'FREE',
      name: t.label,
      description: t.description,
      priceMonthly: 0,
      priceYearly: 0,
      dailyEarnings: t.metadata.estimatedDailyEarnings,
      videos: t.metadata.maxDailyVideos,
      games: t.metadata.maxDailyGames,
      surveys: t.metadata.maxDailySurveys,
      features: t.features,
    });
  }

  return list.sort((a, b) => tierRank(a.tier) - tierRank(b.tier));
}

function priceFor(plan: PlanView, cycle: BillingCycle) {
  return cycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;
}

function yearlySavings(plan: PlanView) {
  const full = plan.priceMonthly * 12;
  if (!full || !plan.priceYearly) return 0;
  return Math.max(0, full - plan.priceYearly);
}

export default function PlansPage() {
  const { data, isLoading, refetch } = useBadges();
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [checkoutPlan, setCheckoutPlan] = useState<PlanView | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const plans = useMemo(() => buildPlans(data?.allPlans ?? []), [data]);
  const subscription = data?.subscription ?? null;
  const currentTier = subscription?.plan?.tier ?? 'FREE';
  const currentPlan = plans.find((p) => p.tier === currentTier) ?? plans[0];

  const loadBalance = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (!res.ok) return;
      const json = await res.json();
      const b = json?.wallet?.fiat?.balance ?? json?.wallet?.balance;
      if (typeof b === 'number') setBalance(b);
    } catch {
      /* balance is informational; the server re-checks it */
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const openCheckout = (plan: PlanView) => {
    setError(null);
    setSuccess(null);
    setCheckoutPlan(plan);
    loadBalance();
  };

  const handleSubscribe = async () => {
    if (!checkoutPlan?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/subscriptions/plans/${checkoutPlan.id}/subscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billingCycle: cycle }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Could not activate plan');
      setSuccess(
        `${checkoutPlan.name} is active. You can now complete more tasks and withdraw every day.`,
      );
      setCheckoutPlan(null);
      await Promise.all([refetch(), loadBalance()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not activate plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Could not cancel plan');
      setConfirmCancel(false);
      setSuccess('Your plan was cancelled. You are now on the Free plan.');
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel plan');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4 font-outfit">
        <div className="h-8 w-48 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
        <div className="h-20 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const checkoutPrice = checkoutPlan ? priceFor(checkoutPlan, cycle) : 0;
  const notEnough =
    checkoutPlan !== null && balance !== null && balance < checkoutPrice;

  return (
    <div className="space-y-6 pb-8 font-outfit">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
          Choose your plan
        </h1>
        <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8] max-w-2xl">
          The Free plan earns a little every day and withdraws once every{' '}
          {FREE_WITHDRAWAL_INTERVAL_DAYS} days. Any paid plan unlocks more daily
          tasks and lets you withdraw every day. Payouts go to your mobile
          money at {PAYOUT_TIME_LABEL}.
        </p>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-sm text-[#166534] dark:border-[#22C55E]/30 dark:bg-[#22C55E]/10 dark:text-[#4ADE80]">
          <Check size={18} className="mt-0.5 flex-shrink-0" />
          <p className="flex-1">{success}</p>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      {error && !checkoutPlan && (
        <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] dark:border-[#EF4444]/30 dark:bg-[#EF4444]/10 dark:text-[#FCA5A5]">
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Current plan */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] dark:bg-[#2563EB]/15 dark:text-[#60A5FA]">
              <Crown size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Your current plan
              </p>
              <p className="font-bold text-[#0F172A] dark:text-white">
                {currentPlan?.name ?? 'Free'}
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {currentPlan
                  ? `${currentPlan.videos} videos · ${currentPlan.games} games · ${currentPlan.surveys} surveys a day · Withdraw ${describeWithdrawalFrequency(currentTier).toLowerCase()}`
                  : ''}
                {subscription?.expiresAt &&
                  ` · Renews or ends ${new Date(subscription.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
            </div>
          </div>

          {subscription && currentTier !== 'FREE' && (
            <div className="flex items-center gap-2">
              {confirmCancel ? (
                <>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Cancel and go back to Free?
                  </span>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="rounded-lg bg-[#EF4444] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="rounded-lg border border-[#E2E8F0] dark:border-[#334155] px-3 py-2 text-xs font-semibold text-[#0F172A] dark:text-white"
                  >
                    Keep plan
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#EF4444] dark:text-[#94A3B8]"
                >
                  Cancel plan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] p-1">
          {(['MONTHLY', 'YEARLY'] as BillingCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                cycle === c
                  ? 'bg-white text-[#0F172A] shadow-sm dark:bg-[#1E293B] dark:text-white'
                  : 'text-[#64748B] dark:text-[#94A3B8]',
              )}
            >
              {c === 'MONTHLY' ? 'Monthly' : 'Yearly'}
              {c === 'YEARLY' && (
                <span className="ml-1.5 rounded-full bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-bold text-[#15803D] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]">
                  Save
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isRecommended = plan.tier === RECOMMENDED_TIER && !isCurrent;
          const isFree = plan.tier === 'FREE';
          const price = priceFor(plan, cycle);
          const savings = cycle === 'YEARLY' ? yearlySavings(plan) : 0;
          const isDowngrade = tierRank(plan.tier) < tierRank(currentTier);

          return (
            <div
              key={plan.tier}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white dark:bg-[#1E293B] p-5 transition-shadow hover:shadow-md',
                isRecommended
                  ? 'border-[#2563EB] ring-1 ring-[#2563EB]'
                  : isCurrent
                    ? 'border-[#22C55E]'
                    : 'border-[#E2E8F0] dark:border-[#334155]',
              )}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles size={10} /> Most popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-[#22C55E] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Current plan
                </span>
              )}

              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  {plan.name}
                </h3>
                <span className="text-xs font-semibold text-[#22C55E] dark:text-[#4ADE80]">
                  ≈ {rwf(plan.dailyEarnings)}/day
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                {plan.description}
              </p>

              <div className="mt-4">
                {isFree ? (
                  <p className="text-2xl font-extrabold text-[#0F172A] dark:text-white">
                    Free
                  </p>
                ) : (
                  <p className="text-2xl font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                    {rwf(price)}
                    <span className="ml-1 text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      /{cycle === 'MONTHLY' ? 'month' : 'year'}
                    </span>
                  </p>
                )}
                {savings > 0 && (
                  <p className="text-xs font-semibold text-[#15803D] dark:text-[#4ADE80]">
                    Save {rwf(savings)} vs monthly
                  </p>
                )}
              </div>

              {/* Daily tasks */}
              <div className="mt-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] p-3 space-y-2 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                  Daily tasks
                </p>
                <Row icon={<PlayCircle size={14} />} label="Sponsored videos" value={plan.videos} />
                <Row icon={<Gamepad2 size={14} />} label="Games" value={plan.games} />
                <Row icon={<ClipboardList size={14} />} label="Surveys" value={plan.surveys} />
                <div className="flex items-center justify-between border-t border-[#E2E8F0] dark:border-[#334155] pt-2">
                  <span className="flex items-center gap-2 text-[#475569] dark:text-[#CBD5E1]">
                    <Smartphone size={14} /> Withdraw
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      isFree
                        ? 'text-[#64748B] dark:text-[#94A3B8]'
                        : 'text-[#2563EB] dark:text-[#60A5FA]',
                    )}
                  >
                    {describeWithdrawalFrequency(plan.tier)}
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-[#475569] dark:text-[#CBD5E1] flex-1">
                {plan.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 flex-shrink-0 text-[#22C55E]" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <div className="w-full rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] py-2.5 text-center text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    Your plan
                  </div>
                ) : isFree || isDowngrade ? (
                  <div className="w-full py-2.5 text-center text-xs text-[#94A3B8]">
                    {isFree ? 'Included for everyone' : 'Lower than your current plan'}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCheckout(plan)}
                    disabled={!plan.id || (!!subscription && currentTier !== 'FREE')}
                    title={
                      subscription && currentTier !== 'FREE'
                        ? 'Cancel your current plan first to switch'
                        : undefined
                    }
                    className={cn(
                      'w-full rounded-xl py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      isRecommended
                        ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                        : 'border border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] dark:text-[#60A5FA] dark:hover:bg-[#2563EB]/10',
                    )}
                  >
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {subscription && currentTier !== 'FREE' && (
        <p className="text-center text-xs text-[#94A3B8]">
          To switch plans, cancel your current plan first, then pick a new one.
        </p>
      )}

      {/* Comparison */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
        <button
          type="button"
          onClick={() => setShowCompare((v) => !v)}
          className="flex w-full items-center justify-between p-4 text-sm font-bold text-[#0F172A] dark:text-white"
        >
          Compare all plans
          <ChevronDown
            size={18}
            className={cn('transition-transform', showCompare && 'rotate-180')}
          />
        </button>
        {showCompare && (
          <div className="overflow-x-auto border-t border-[#E2E8F0] dark:border-[#334155]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <th className="p-3 font-semibold">Per day</th>
                  {plans.map((p) => (
                    <th
                      key={p.tier}
                      className={cn(
                        'p-3 text-center font-semibold',
                        p.tier === currentTier && 'text-[#22C55E]',
                      )}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#0F172A] dark:text-white tabular-nums">
                <CompareRow label={cycle === 'MONTHLY' ? 'Price / month' : 'Price / year'} plans={plans} render={(p) => (p.tier === 'FREE' ? 'Free' : rwf(priceFor(p, cycle)))} />
                <CompareRow label="Earning potential" plans={plans} render={(p) => `≈ ${rwf(p.dailyEarnings)}`} />
                <CompareRow label="Sponsored videos" plans={plans} render={(p) => p.videos} />
                <CompareRow label="Games" plans={plans} render={(p) => p.games} />
                <CompareRow label="Surveys" plans={plans} render={(p) => p.surveys} />
                <CompareRow label="Withdraw" plans={plans} render={(p) => describeWithdrawalFrequency(p.tier)} />
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-[#94A3B8]">
        Earning potential is an estimate if you complete all daily tasks; it is
        not guaranteed.{' '}
        <Link href="/badges" className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
          Looking for earning boost badges? →
        </Link>
      </p>

      {/* Checkout sheet */}
      {checkoutPlan && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => !submitting && setCheckoutPlan(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1E293B] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                Upgrade to {checkoutPlan.name}
              </h2>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                disabled={submitting}
                aria-label="Close"
                className="text-[#64748B]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8]">
                  {cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'} price
                </span>
                <span className="font-bold text-[#0F172A] dark:text-white">
                  {rwf(checkoutPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                  <Wallet size={14} /> Wallet balance
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    notEnough ? 'text-[#EF4444]' : 'text-[#0F172A] dark:text-white',
                  )}
                >
                  {balance === null ? '—' : rwf(balance)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E2E8F0] dark:border-[#334155] pt-2">
                <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                  <Clock size={14} /> Withdraw
                </span>
                <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                  Every day at {PAYOUT_TIME_LABEL}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
              The price is paid from your Boostly wallet balance. Your new daily
              tasks ({checkoutPlan.videos} videos, {checkoutPlan.games} games,{' '}
              {checkoutPlan.surveys} surveys) start right away.
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-[#FEF2F2] dark:bg-[#EF4444]/10 p-3 text-sm text-[#B91C1C] dark:text-[#FCA5A5]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubscribe}
              disabled={submitting || notEnough}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Activating…
                </>
              ) : notEnough ? (
                'Not enough balance'
              ) : (
                `Pay ${rwf(checkoutPrice)} and activate`
              )}
            </button>
            {notEnough && (
              <p className="mt-2 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
                You need {rwf(checkoutPrice - (balance ?? 0))} more.{' '}
                <Link href="/dashboard" className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                  Complete today&apos;s tasks
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[#475569] dark:text-[#CBD5E1]">
        {icon} {label}
      </span>
      <span className="font-semibold text-[#0F172A] dark:text-white tabular-nums">
        {value}
      </span>
    </div>
  );
}

function CompareRow({
  label,
  plans,
  render,
}: {
  label: string;
  plans: PlanView[];
  render: (p: PlanView) => React.ReactNode;
}) {
  return (
    <tr className="border-t border-[#F1F5F9] dark:border-[#334155]">
      <td className="p-3 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
        {label}
      </td>
      {plans.map((p) => (
        <td key={p.tier} className="p-3 text-center">
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
