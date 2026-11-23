// src/app/(dashboard)/plans/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Gamepad2,
  ClipboardList,
  Loader2,
  PlayCircle,
  RefreshCw,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBadges, type SubscriptionPlan } from '@/hooks/useBadges';
import { MomoCheckout } from '@/components/app/MomoCheckout';
import {
  FREE_WITHDRAWAL_INTERVAL_DAYS,
  PAYOUT_TIME_LABEL,
  describeIntervalDays,
} from '@/lib/constants/payouts';

type BillingCycle = 'MONTHLY' | 'YEARLY';

interface PlanView {
  id: string;
  tier: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  /** Reward per task multiplier: 1 + plan boost. */
  rate: number;
  videos: number;
  games: number;
  surveys: number;
  features: string[];
  /** Max RWF a member can earn from tasks per day; 0 = no maximum. */
  dailyMax: number;
  withdrawLabel: string;
  isPopular: boolean;
}

const MEMBERSHIP_BENEFITS = [
  "Earn every day by completing your plan's tasks.",
  'Access earning opportunities based on your membership level.',
  'Track your daily earnings on your dashboard.',
  "Upgrade your plan whenever you're ready.",
];

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;
/** 1 -> "Standard", 1.3 -> "+30%", 2.5 -> "2.5x" */
function formatRate(rate: number) {
  if (rate <= 1.001) return 'Standard';
  return `+${Math.round((rate - 1) * 100)}%`;
}

/** Plans exactly as the API returns them (admin-managed, display order). */
function buildPlans(apiPlans: SubscriptionPlan[]): PlanView[] {
  return apiPlans.map<PlanView>((p) => ({
    id: p.id,
    tier: p.tier,
    name: p.name.replace(/\s*Plan$/i, ''),
    description: p.description ?? '',
    priceMonthly: p.priceMonthly ?? 0,
    priceYearly: p.priceYearly ?? 0,
    rate: 1 + (p.badgeBoost ?? 0),
    videos: p.maxDailyVideos ?? 0,
    games: p.maxDailyGames ?? 0,
    surveys: p.maxDailySurveys ?? 0,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    dailyMax: p.dailyEarnings ?? 0,
    withdrawLabel: describeIntervalDays(
      p.withdrawalIntervalDays ?? (p.tier === 'FREE' ? 7 : 1),
    ),
    isPopular: p.isPopular === true,
  }));
}

function priceFor(plan: PlanView, cycle: BillingCycle) {
  return cycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;
}

function yearlySavings(plan: PlanView) {
  const full = plan.priceMonthly * 12;
  if (!full || !plan.priceYearly) return 0;
  return Math.max(0, full - plan.priceYearly);
}

interface PlanPaymentView {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  amount: number;
  transactionRef: string;
  rejectionReason: string | null;
  createdAt: string;
  plan?: { name: string; tier: string } | null;
}

export default function PlansPage() {
  const { data, isLoading, error: loadError, refetch } = useBadges();
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [checkoutPlan, setCheckoutPlan] = useState<PlanView | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [payMethod, setPayMethod] = useState<'MOMO' | 'WALLET'>('MOMO');
  const [payments, setPayments] = useState<PlanPaymentView[]>([]);

  const loadPayments = async () => {
    try {
      const res = await fetch('/api/plan-payments', { cache: 'no-store' });
      if (res.ok) setPayments((await res.json()).payments || []);
    } catch {
      /* informational */
    }
  };

  const plans = useMemo(() => buildPlans(data?.allPlans ?? []), [data]);
  const subscription = data?.subscription ?? null;
  const currentTier = subscription?.plan?.tier ?? 'FREE';
  const currentPlanId = subscription?.plan?.id ?? null;
  // Match the member's plan by id first, then by tier (Free has no subscription).
  const currentIndex = (() => {
    const byId = currentPlanId ? plans.findIndex((p) => p.id === currentPlanId) : -1;
    if (byId !== -1) return byId;
    return plans.findIndex((p) => p.tier === currentTier);
  })();
  const currentPlan: PlanView | undefined =
    plans[currentIndex] ?? plans.find((p) => p.tier === 'FREE') ?? plans[0];
  const currentPrice = subscription?.plan?.priceMonthly ?? currentPlan?.priceMonthly ?? 0;
  const plansUnavailable = !isLoading && (!!loadError || plans.length === 0);

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
    loadPayments();
  }, []);

  const pendingPayment = payments.find((p) => p.status === 'PENDING') ?? null;
  // Show a rejection only until the member submits again.
  const lastRejected =
    !pendingPayment && payments[0]?.status === 'REJECTED' ? payments[0] : null;

  const openCheckout = (plan: PlanView) => {
    setError(null);
    setSuccess(null);
    setCheckoutPlan(plan);
    // Wallet purchase only works without an active paid plan.
    setPayMethod('MOMO');
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

  if (plansUnavailable) {
    return (
      <div className="space-y-4 font-outfit">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
          Choose your plan
        </h1>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B45309] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="font-bold text-[#0F172A] dark:text-white">
              We couldn&apos;t load the plans
            </p>
            <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
              Check your connection and try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8]"
          >
            <RefreshCw size={16} /> Try again
          </button>
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
          Each plan sets how many tasks you can do a day, the most you can earn
          from them, and how often you can withdraw (Free: once every{' '}
          {FREE_WITHDRAWAL_INTERVAL_DAYS} days). Withdrawals are paid to mobile
          money at {PAYOUT_TIME_LABEL} Kigali time.
        </p>
        <p className="mt-2 max-w-2xl rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-3 text-xs text-[#475569] dark:text-[#CBD5E1]">
          <strong className="text-[#0F172A] dark:text-white">How rewards are funded:</strong>{' '}
          every task reward is paid from real sponsor and advertising budgets.
          There are no fixed or guaranteed daily earnings: each plan&apos;s daily
          amount is a maximum, and when a sponsor&apos;s budget is used up, its
          tasks pause until new budget is added.
        </p>
      </div>

      {/* Membership benefits */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-5">
        <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">
          Membership benefits
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {MEMBERSHIP_BENEFITS.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm text-[#475569] dark:text-[#CBD5E1]"
            >
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-[#22C55E]" />
              {b}
            </li>
          ))}
        </ul>
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
      {pendingPayment && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] dark:bg-[#2563EB]/10 dark:border-[#2563EB]/30 p-4">
          <Clock size={18} className="mt-0.5 shrink-0 text-[#2563EB]" />
          <div className="text-sm">
            <p className="font-semibold text-[#0F172A] dark:text-white">
              Checking your payment for {pendingPayment.plan?.name ?? 'your plan'}
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              {rwf(pendingPayment.amount)} · transaction {pendingPayment.transactionRef}. Your plan
              activates as soon as an admin confirms it.
            </p>
          </div>
        </div>
      )}
      {lastRejected && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] dark:bg-[#EF4444]/10 dark:border-[#EF4444]/30 p-4">
          <X size={18} className="mt-0.5 shrink-0 text-[#DC2626]" />
          <div className="text-sm">
            <p className="font-semibold text-[#0F172A] dark:text-white">
              We couldn&apos;t confirm your last payment
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              {lastRejected.rejectionReason || 'Please check the details and try again.'}
            </p>
          </div>
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
                  ? `${currentPlan.videos} videos · ${currentPlan.games} games · ${currentPlan.surveys} surveys a day · Withdraw ${currentPlan.withdrawLabel.toLowerCase()}`
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
        {plans.map((plan, index) => {
          const isCurrent = currentIndex !== -1 ? index === currentIndex : plan.tier === currentTier;
          const isRecommended = plan.isPopular && !isCurrent;
          const isFree = plan.tier === 'FREE';
          const price = priceFor(plan, cycle);
          const savings = cycle === 'YEARLY' ? yearlySavings(plan) : 0;
          // Plans are in admin display order; fall back to price if the
          // member's plan is no longer listed.
          const isDowngrade =
            currentIndex !== -1 ? index < currentIndex : plan.priceMonthly < currentPrice;

          return (
            <div
              key={plan.id}
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
                  {formatRate(plan.rate)} per task
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

              {plan.dailyMax > 0 && (
                <div className="mt-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 dark:border-[#F59E0B]/30 dark:bg-[#F59E0B]/10">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-[#0F172A] dark:text-white">
                    <TrendingUp size={15} className="flex-shrink-0 text-[#F59E0B]" />
                    Earn up to{' '}
                    <span className="tabular-nums">{rwf(plan.dailyMax)}</span>/day
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Daily maximum · paid from sponsor budgets
                  </p>
                </div>
              )}

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
                    {plan.withdrawLabel}
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-[#475569] dark:text-[#CBD5E1] flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 flex-shrink-0 text-[#22C55E]" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent && !isFree ? (
                  <button
                    type="button"
                    onClick={() => openCheckout(plan)}
                    disabled={!plan.id || !!pendingPayment}
                    className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#334155] py-2.5 text-sm font-semibold text-[#0F172A] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] disabled:opacity-50"
                  >
                    Your plan · Renew
                  </button>
                ) : isCurrent ? (
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
                    disabled={!plan.id || !!pendingPayment}
                    title={pendingPayment ? 'A payment is waiting for review' : undefined}
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
                      key={p.id}
                      className={cn(
                        'p-3 text-center font-semibold',
                        p === currentPlan && 'text-[#22C55E]',
                      )}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#0F172A] dark:text-white tabular-nums">
                <CompareRow label={cycle === 'MONTHLY' ? 'Price / month' : 'Price / year'} plans={plans} render={(p) => (p.tier === 'FREE' ? 'Free' : rwf(priceFor(p, cycle)))} />
                <CompareRow label="Max per day" plans={plans} render={(p) => (p.dailyMax > 0 ? rwf(p.dailyMax) : 'No maximum')} />
                <CompareRow label="Reward per task" plans={plans} render={(p) => formatRate(p.rate)} />
                <CompareRow label="Sponsored videos" plans={plans} render={(p) => p.videos} />
                <CompareRow label="Games" plans={plans} render={(p) => p.games} />
                <CompareRow label="Surveys" plans={plans} render={(p) => p.surveys} />
                <CompareRow label="Withdraw" plans={plans} render={(p) => p.withdrawLabel} />
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-[#94A3B8]">
        &ldquo;Earn up to&rdquo; is a daily maximum, not a guaranteed amount: what
        you earn depends on the tasks you complete and available sponsor budgets.{' '}
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

            {/* Payment method */}
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] p-1">
              {(['MOMO', 'WALLET'] as const).map((m) => {
                const walletBlocked = m === 'WALLET' && !!subscription && currentTier !== 'FREE';
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={walletBlocked}
                    onClick={() => setPayMethod(m)}
                    title={walletBlocked ? 'Wallet payment is only for members without a paid plan' : undefined}
                    className={cn(
                      'rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-40',
                      payMethod === m
                        ? 'bg-white text-[#0F172A] shadow-sm dark:bg-[#334155] dark:text-white'
                        : 'text-[#64748B] dark:text-[#94A3B8]',
                    )}
                  >
                    {m === 'MOMO' ? 'Mobile money' : 'Wallet balance'}
                  </button>
                );
              })}
            </div>

            {payMethod === 'MOMO' ? (
              <div className="max-h-[65vh] overflow-y-auto -mx-1 px-1">
                <MomoCheckout
                  planId={checkoutPlan.id!}
                  planName={checkoutPlan.name}
                  amount={checkoutPrice}
                  billingCycle={cycle}
                  onSubmitted={loadPayments}
                />
              </div>
            ) : (
              <>
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
              </>
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
        <td key={p.id} className="p-3 text-center">
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
