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
import { FREE_WITHDRAWAL_INTERVAL_DAYS } from '@/lib/constants/payouts';
import { useT } from '@/lib/i18n';
import { common } from '@/lib/i18n/messages/common';
import { plans as plansMsg } from '@/lib/i18n/messages/plans';
import { usePayoutText, useRwf } from '@/lib/i18n/messages/wallet';

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
  /** Per-type multipliers when the plan sets different boosts. */
  rates: { videos: number; games: number; surveys: number } | null;
  videos: number;
  games: number;
  surveys: number;
  features: string[];
  /** Max RWF a member can earn from tasks per day; 0 = no maximum. */
  dailyMax: number;
  /** Days between withdrawals; shown as a localised frequency. */
  withdrawDays: number;
  isPopular: boolean;
}

const MEMBERSHIP_BENEFITS = ['benefit1', 'benefit2', 'benefit3', 'benefit4'] as const;

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
    rates: (() => {
      const x = p as typeof p & { videoBoost?: number | null; gameBoost?: number | null; surveyBoost?: number | null };
      if (x.videoBoost == null && x.gameBoost == null && x.surveyBoost == null) return null;
      const base = p.badgeBoost ?? 0;
      return { videos: 1 + (x.videoBoost ?? base), games: 1 + (x.gameBoost ?? base), surveys: 1 + (x.surveyBoost ?? base) };
    })(),
    videos: p.maxDailyVideos ?? 0,
    games: p.maxDailyGames ?? 0,
    surveys: p.maxDailySurveys ?? 0,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    dailyMax: p.dailyEarnings ?? 0,
    withdrawDays: p.withdrawalIntervalDays ?? (p.tier === 'FREE' ? 7 : 1),
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
  const t = useT(plansMsg);
  const tc = useT(common);
  const rwf = useRwf();
  const { frequency, payoutTime, tag } = usePayoutText();
  /** 1 -> "Standard", 1.3 -> "+30%" */
  const formatRate = (rate: number) =>
    rate <= 1.001 ? t('rateStandard') : `+${Math.round((rate - 1) * 100)}%`;
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
  // Server quote for the open checkout: new / renewal / upgrade with credit.
  const [quote, setQuote] = useState<{
    kind: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE_BLOCKED';
    price: number;
    credit: number;
    due: number;
    message: string | null;
  } | null>(null);

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
    setPayMethod('MOMO');
    loadBalance();
  };

  // Fetch what this member would pay for the open checkout and cycle.
  useEffect(() => {
    setQuote(null);
    if (!checkoutPlan?.id) return;
    let cancelled = false;
    fetch(`/api/subscriptions/plans/${checkoutPlan.id}/quote?cycle=${cycle}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => {
        if (cancelled || !q) return;
        setQuote(q);
        // Prefer the wallet when it already covers the amount due.
        if (balance !== null && balance >= q.due) setPayMethod('WALLET');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutPlan?.id, cycle]);

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
      if (!res.ok) throw new Error(json?.error || t('activateFailed'));
      setSuccess(t('activated', { plan: checkoutPlan.name }));
      setCheckoutPlan(null);
      await Promise.all([refetch(), loadBalance()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('activateFailed'));
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
      if (!res.ok) throw new Error(json?.error || t('cancelFailed'));
      setConfirmCancel(false);
      setSuccess(t('cancelled'));
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cancelFailed'));
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
          {t('choosePlan')}
        </h1>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B45309] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="font-bold text-[#0F172A] dark:text-white">
              {t('loadFailed')}
            </p>
            <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
              {t('checkConnection')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8]"
          >
            <RefreshCw size={16} /> {tc('retry')}
          </button>
        </div>
      </div>
    );
  }

  const listPrice = checkoutPlan ? priceFor(checkoutPlan, cycle) : 0;
  const checkoutPrice = quote ? quote.due : listPrice;
  const blocked = quote?.kind === 'DOWNGRADE_BLOCKED';
  const notEnough =
    checkoutPlan !== null && balance !== null && balance < checkoutPrice;

  return (
    <div className="space-y-6 pb-8 font-outfit">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
          {t('choosePlan')}
        </h1>
        <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8] max-w-2xl">
          {t('intro', { days: FREE_WITHDRAWAL_INTERVAL_DAYS, time: payoutTime })}
        </p>
        <p className="mt-2 max-w-2xl rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-3 text-xs text-[#475569] dark:text-[#CBD5E1]">
          <strong className="text-[#0F172A] dark:text-white">{t('fundingTitle')}</strong>{' '}
          {t('fundingBody')}
        </p>
      </div>

      {/* Membership benefits */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-5">
        <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">
          {t('benefitsTitle')}
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {MEMBERSHIP_BENEFITS.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm text-[#475569] dark:text-[#CBD5E1]"
            >
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-[#22C55E]" />
              {t(b)}
            </li>
          ))}
        </ul>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-sm text-[#166534] dark:border-[#22C55E]/30 dark:bg-[#22C55E]/10 dark:text-[#4ADE80]">
          <Check size={18} className="mt-0.5 flex-shrink-0" />
          <p className="flex-1">{success}</p>
          <button type="button" onClick={() => setSuccess(null)} aria-label={t('dismiss')}>
            <X size={16} />
          </button>
        </div>
      )}
      {pendingPayment && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] dark:bg-[#2563EB]/10 dark:border-[#2563EB]/30 p-4">
          <Clock size={18} className="mt-0.5 shrink-0 text-[#2563EB]" />
          <div className="text-sm">
            <p className="font-semibold text-[#0F172A] dark:text-white">
              {t('checkingPayment', { plan: pendingPayment.plan?.name ?? t('yourPlanFallback') })}
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              {t('pendingBody', { amount: rwf(pendingPayment.amount), ref: pendingPayment.transactionRef })}
            </p>
          </div>
        </div>
      )}
      {lastRejected && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] dark:bg-[#EF4444]/10 dark:border-[#EF4444]/30 p-4">
          <X size={18} className="mt-0.5 shrink-0 text-[#DC2626]" />
          <div className="text-sm">
            <p className="font-semibold text-[#0F172A] dark:text-white">
              {t('rejectedTitle')}
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              {lastRejected.rejectionReason || t('rejectedFallback')}
            </p>
          </div>
        </div>
      )}

      {error && !checkoutPlan && (
        <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] dark:border-[#EF4444]/30 dark:bg-[#EF4444]/10 dark:text-[#FCA5A5]">
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label={t('dismiss')}>
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
                {t('currentPlan')}
              </p>
              <p className="font-bold text-[#0F172A] dark:text-white">
                {currentPlan?.name ?? t('free')}
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {currentPlan
                  ? t('planSummary', {
                      videos: currentPlan.videos,
                      games: currentPlan.games,
                      surveys: currentPlan.surveys,
                      frequency: frequency(currentPlan.withdrawDays).toLowerCase(),
                    })
                  : ''}
                {subscription?.expiresAt &&
                  t('renewsOn', {
                    date: new Date(subscription.expiresAt).toLocaleDateString(tag, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }),
                  })}
              </p>
            </div>
          </div>

          {subscription && currentTier !== 'FREE' && (
            <div className="flex items-center gap-2">
              {confirmCancel ? (
                <>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {t('confirmCancel')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="rounded-lg bg-[#EF4444] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {cancelling ? t('cancelling') : t('yesCancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="rounded-lg border border-[#E2E8F0] dark:border-[#334155] px-3 py-2 text-xs font-semibold text-[#0F172A] dark:text-white"
                  >
                    {t('keepPlan')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#EF4444] dark:text-[#94A3B8]"
                >
                  {t('cancelPlan')}
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
              {c === 'MONTHLY' ? t('monthly') : t('yearly')}
              {c === 'YEARLY' && (
                <span className="ml-1.5 rounded-full bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-bold text-[#15803D] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]">
                  {t('save')}
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
                  <Sparkles size={10} /> {t('mostPopular')}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-[#22C55E] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t('currentBadge')}
                </span>
              )}

              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  {plan.name}
                </h3>
                <span className="text-xs font-semibold text-[#22C55E] dark:text-[#4ADE80]">
                  {t('perTask', { rate: formatRate(plan.rate) })}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                {plan.description}
              </p>
              {plan.rates && (
                <p className="mt-1 text-[11px] font-medium text-[#16A34A] dark:text-[#4ADE80]">
                  {t('typeRates', {
                    videos: formatRate(plan.rates.videos),
                    games: formatRate(plan.rates.games),
                    surveys: formatRate(plan.rates.surveys),
                  })}
                </p>
              )}

              <div className="mt-4">
                {isFree ? (
                  <p className="text-2xl font-extrabold text-[#0F172A] dark:text-white">
                    {t('free')}
                  </p>
                ) : (
                  <p className="text-2xl font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                    {rwf(price)}
                    <span className="ml-1 text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      /{cycle === 'MONTHLY' ? t('perMonth') : t('perYear')}
                    </span>
                  </p>
                )}
                {savings > 0 && (
                  <p className="text-xs font-semibold text-[#15803D] dark:text-[#4ADE80]">
                    {t('saveVsMonthly', { amount: rwf(savings) })}
                  </p>
                )}
              </div>

              {plan.dailyMax > 0 && (
                <div className="mt-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 dark:border-[#F59E0B]/30 dark:bg-[#F59E0B]/10">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-[#0F172A] dark:text-white">
                    <TrendingUp size={15} className="flex-shrink-0 text-[#F59E0B]" />
                    {t('earnUpTo')}{' '}
                    <span className="tabular-nums">{rwf(plan.dailyMax)}</span>{t('perDaySuffix')}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    {t('dailyMaxNote')}
                  </p>
                </div>
              )}

              {/* Daily tasks */}
              <div className="mt-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] p-3 space-y-2 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                  {t('dailyTasks')}
                </p>
                <Row icon={<PlayCircle size={14} />} label={t('sponsoredVideos')} value={plan.videos} />
                <Row icon={<Gamepad2 size={14} />} label={t('games')} value={plan.games} />
                <Row icon={<ClipboardList size={14} />} label={t('surveys')} value={plan.surveys} />
                <div className="flex items-center justify-between border-t border-[#E2E8F0] dark:border-[#334155] pt-2">
                  <span className="flex items-center gap-2 text-[#475569] dark:text-[#CBD5E1]">
                    <Smartphone size={14} /> {t('withdraw')}
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      isFree
                        ? 'text-[#64748B] dark:text-[#94A3B8]'
                        : 'text-[#2563EB] dark:text-[#60A5FA]',
                    )}
                  >
                    {frequency(plan.withdrawDays)}
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
                    {t('yourPlanRenew')}
                  </button>
                ) : isCurrent ? (
                  <div className="w-full rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] py-2.5 text-center text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {t('yourPlan')}
                  </div>
                ) : isFree || isDowngrade ? (
                  <div className="w-full py-2.5 text-center text-xs text-[#94A3B8]">
                    {isFree ? t('includedForEveryone') : t('lowerThanCurrent')}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCheckout(plan)}
                    disabled={!plan.id || !!pendingPayment}
                    title={pendingPayment ? t('paymentWaiting') : undefined}
                    className={cn(
                      'w-full rounded-xl py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      isRecommended
                        ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                        : 'border border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] dark:text-[#60A5FA] dark:hover:bg-[#2563EB]/10',
                    )}
                  >
                    {t('upgradeTo', { plan: plan.name })}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {subscription && currentTier !== 'FREE' && (
        <p className="text-center text-xs text-[#94A3B8]">
          {t('switchHint')}
        </p>
      )}

      {/* Comparison */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
        <button
          type="button"
          onClick={() => setShowCompare((v) => !v)}
          className="flex w-full items-center justify-between p-4 text-sm font-bold text-[#0F172A] dark:text-white"
        >
          {t('compareAll')}
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
                  <th className="p-3 font-semibold">{t('perDay')}</th>
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
                <CompareRow label={cycle === 'MONTHLY' ? t('priceMonth') : t('priceYear')} plans={plans} render={(p) => (p.tier === 'FREE' ? t('free') : rwf(priceFor(p, cycle)))} />
                <CompareRow label={t('maxPerDay')} plans={plans} render={(p) => (p.dailyMax > 0 ? rwf(p.dailyMax) : t('noMaximum'))} />
                <CompareRow label={t('rewardPerTask')} plans={plans} render={(p) => formatRate(p.rate)} />
                <CompareRow label={t('sponsoredVideos')} plans={plans} render={(p) => p.videos} />
                <CompareRow label={t('games')} plans={plans} render={(p) => p.games} />
                <CompareRow label={t('surveys')} plans={plans} render={(p) => p.surveys} />
                <CompareRow label={t('withdraw')} plans={plans} render={(p) => frequency(p.withdrawDays)} />
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-[#94A3B8]">
        {t('disclaimer')}{' '}
        <Link href="/badges" className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
          {t('badgesLink')}
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
                {t('upgradeTo', { plan: checkoutPlan.name })}
              </h2>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                disabled={submitting}
                aria-label={t('close')}
                className="text-[#64748B]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Payment method */}
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] p-1">
              {(['MOMO', 'WALLET'] as const).map((m) => {
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={cn(
                      'rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-40',
                      payMethod === m
                        ? 'bg-white text-[#0F172A] shadow-sm dark:bg-[#334155] dark:text-white'
                        : 'text-[#64748B] dark:text-[#94A3B8]',
                    )}
                  >
                    {m === 'MOMO' ? t('mobileMoney') : t('walletBalance')}
                  </button>
                );
              })}
            </div>

            {blocked ? (
              <p className="mt-4 rounded-xl bg-[#FFFBEB] p-4 text-sm text-[#92400E] dark:bg-[#F59E0B]/10 dark:text-[#FCD34D]">
                {quote?.message}
              </p>
            ) : payMethod === 'MOMO' ? (
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
                    {cycle === 'MONTHLY' ? t('monthlyPrice') : t('yearlyPrice')}
                  </span>
                  <span className="font-semibold text-[#0F172A] dark:text-white">
                    {rwf(listPrice)}
                  </span>
                </div>
                {quote?.kind === 'UPGRADE' && quote.credit > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">{t('creditUnused')}</span>
                    <span className="font-semibold text-[#16A34A] dark:text-[#4ADE80]">−{rwf(quote.credit)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-[#0F172A] dark:text-white">{t('toPayNow')}</span>
                  <span className="font-bold text-[#0F172A] dark:text-white">{rwf(checkoutPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                    <Wallet size={14} /> {t('walletBalance')}
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
                    <Clock size={14} /> {t('withdraw')}
                  </span>
                  <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                    {t('withdrawPaidAt', { frequency: frequency(checkoutPlan.withdrawDays), time: payoutTime })}
                  </span>
                </div>
              </div>
  
              <p className="mt-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                {quote?.kind === 'UPGRADE'
                  ? t('upgradeNote')
                  : quote?.kind === 'RENEWAL'
                    ? t('renewalNote')
                    : ''}
                {t('walletNote', {
                  videos: checkoutPlan.videos,
                  games: checkoutPlan.games,
                  surveys: checkoutPlan.surveys,
                })}
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
                    <Loader2 size={16} className="animate-spin" /> {t('activating')}
                  </>
                ) : notEnough ? (
                  t('notEnough')
                ) : checkoutPrice === 0 ? (
                  t('coveredByCredit')
                ) : (
                  t('payAndActivate', { amount: rwf(checkoutPrice) })
                )}
              </button>
              {notEnough && (
                <p className="mt-2 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {t('needMore', { amount: rwf(checkoutPrice - (balance ?? 0)) })}{' '}
                  <Link href="/dashboard" className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                    {t('completeTasks')}
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
