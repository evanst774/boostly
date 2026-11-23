// src/app/(dashboard)/wallet/withdraw/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { useWithdrawalEligibility } from '@/hooks/useEarnToday';
import { PayoutCountdown } from '@/components/earn/PayoutCountdown';
import {
  MOBILE_MONEY_PROVIDERS,
  PAYOUT_TIME_LABEL,
  detectMobileProvider,
  formatPayoutDay,
  formatRwandaPhone,
  normalizeRwandaPhone,
} from '@/lib/constants/payouts';
import { cn } from '@/lib/utils';

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

type Step = 'form' | 'review' | 'done';

interface WithdrawalRow {
  id: string;
  amount: number;
  phoneNumber: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  failureReason: string | null;
}

const STATUS_UI: Record<WithdrawalRow['status'], { label: string; cls: string }> = {
  PENDING: { label: `Waiting for ${PAYOUT_TIME_LABEL}`, cls: 'bg-[#FFFBEB] text-[#B45309] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]' },
  PROCESSING: { label: 'Sending', cls: 'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-[#2563EB]/15 dark:text-[#93C5FD]' },
  COMPLETED: { label: 'Paid', cls: 'bg-[#F0FDF4] text-[#15803D] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]' },
  FAILED: { label: 'Refunded', cls: 'bg-[#FEF2F2] text-[#B91C1C] dark:bg-[#EF4444]/15 dark:text-[#F87171]' },
};

const input =
  'w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all';
const card =
  'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]';

export default function WithdrawPage() {
  const router = useRouter();
  const { data: elig, isLoading, refetch } = useWithdrawalEligibility();

  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ amount: number; phone: string; payoutAt: string } | null>(null);
  const [history, setHistory] = useState<WithdrawalRow[]>([]);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/wallet/withdrawals?limit=5', { cache: 'no-store' });
      if (res.ok) setHistory((await res.json()).withdrawals || []);
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Prefill from the last request.
  useEffect(() => {
    if (!elig) return;
    if (!phone && elig.lastPhoneNumber) setPhone(formatRwandaPhone(elig.lastPhoneNumber));
    if (!accountName && elig.lastAccountName) setAccountName(elig.lastAccountName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elig]);

  const amountNum = Number(amount) || 0;
  const provider = useMemo(() => detectMobileProvider(phone), [phone]);
  const phoneValid = normalizeRwandaPhone(phone) !== null;
  const balance = elig?.balance ?? 0;
  const min = elig?.minAmount ?? 1000;

  const amountError =
    amount === ''
      ? null
      : amountNum < min
        ? `Minimum is ${rwf(min)}`
        : amountNum > balance
          ? 'More than your available balance'
          : !Number.isInteger(amountNum)
            ? 'Use a whole amount'
            : null;

  const formValid =
    !!elig?.canWithdraw &&
    amount !== '' &&
    !amountError &&
    phoneValid &&
    accountName.trim().length >= 2;

  const quickAmounts = [1000, 2000, 5000, 10000].filter((a) => a <= balance);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          method: 'MOBILE_MONEY',
          phoneNumber: phone,
          accountName: accountName.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not submit your withdrawal.');
      setResult({
        amount: amountNum,
        phone: formatRwandaPhone(phone),
        payoutAt: (json.withdrawal?.metadata?.scheduledPayoutAt as string) || elig!.nextPayoutAt,
      });
      setStep('done');
      refetch();
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your withdrawal.');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Back"
        onClick={() => (step === 'review' ? setStep('form') : router.push('/wallet'))}
        className="w-10 h-10 rounded-xl border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center hover:border-[#2563EB] transition-colors"
      >
        <ArrowLeft size={18} />
      </button>
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">Withdraw</h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          To mobile money · paid daily at {PAYOUT_TIME_LABEL}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 font-outfit">
        {header}
        <div className="h-40 rounded-2xl animate-pulse bg-[#F1F5F9] dark:bg-[#1E293B]" />
        <div className="h-64 rounded-2xl animate-pulse bg-[#F1F5F9] dark:bg-[#1E293B]" />
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────
  if (step === 'done' && result) {
    const payoutAt = new Date(result.payoutAt);
    const timeline = [
      { title: 'Request received', body: `${rwf(result.amount)} reserved from your balance.`, done: true },
      { title: `Paid ${formatPayoutDay(payoutAt).toLowerCase()}`, body: `Sent to ${result.phone} in the ${PAYOUT_TIME_LABEL} payout run.`, done: false },
      { title: 'Money on your phone', body: 'You will get an SMS from your mobile money provider.', done: false },
    ];
    return (
      <div className="max-w-lg mx-auto space-y-5 pb-10 font-outfit">
        <div className={cn(card, 'p-6 text-center')}>
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F0FDF4] dark:bg-[#22C55E]/15 flex items-center justify-center mb-3">
            <CheckCircle2 size={30} className="text-[#22C55E]" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">Withdrawal requested</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            {rwf(result.amount)} to {result.phone}
          </p>
          <PayoutCountdown className="mt-3 justify-center" />
        </div>

        <ol className={cn(card, 'p-5 space-y-4')}>
          {timeline.map((t, i) => (
            <li key={t.title} className="flex gap-3">
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  t.done ? 'bg-[#22C55E] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]',
                )}
              >
                {t.done ? <CheckCircle2 size={14} /> : i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{t.title}</p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard" className="text-center py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-sm font-bold">
            Back to tasks
          </Link>
          <Link href="/wallet" className="text-center py-3 rounded-xl bg-[#2563EB] text-white text-sm font-bold">
            View wallet
          </Link>
        </div>
      </div>
    );
  }

  // ── Review ───────────────────────────────────────────────────────
  if (step === 'review' && elig) {
    const rows = [
      ['Amount', rwf(amountNum)],
      ['Send to', `${formatRwandaPhone(phone)}${provider ? ` · ${MOBILE_MONEY_PROVIDERS[provider].label}` : ''}`],
      ['Account name', accountName.trim()],
      ['Fee', 'Free'],
      ['Paid', formatPayoutDay(new Date(elig.nextPayoutAt))],
    ];
    return (
      <div className="max-w-lg mx-auto space-y-5 pb-10 font-outfit">
        {header}
        <div className={cn(card, 'p-5')}>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Check the details</p>
          <dl className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
                <dt className="text-[#64748B] dark:text-[#94A3B8]">{k}</dt>
                <dd className="font-semibold text-right text-[#0F172A] dark:text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-3">
            Make sure the number is correct. Mobile money transfers can&apos;t be reversed once sent.
          </p>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full bg-[#2563EB] text-white font-bold py-4 rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {submitting ? 'Submitting…' : `Confirm ${rwf(amountNum)}`}
        </button>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10 font-outfit">
      {header}

      {/* Balance + payout time */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] p-5 text-white">
        <p className="text-sm text-white/70">Available balance</p>
        <p className="text-3xl font-extrabold tabular-nums">{rwf(balance)}</p>
        {elig && elig.pendingAmount > 0 && (
          <p className="text-xs text-white/70 mt-1">{rwf(elig.pendingAmount)} already waiting for payout</p>
        )}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <PayoutCountdown tone="dark" />
          {elig && (
            <span className="text-[11px] font-semibold bg-white/10 px-2 py-0.5 rounded-full">
              {elig.plan.isFree ? 'Free' : elig.plan.name.replace(/ Plan$/, '')} · {elig.frequencyLabel.toLowerCase()}
            </span>
          )}
        </div>
      </div>

      {/* Not eligible */}
      {elig && !elig.canWithdraw && (
        <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] dark:bg-[#F59E0B]/10 dark:border-[#F59E0B]/30 p-4 flex gap-3">
          <Clock size={20} className="text-[#B45309] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-[#92400E] dark:text-[#FBBF24]">{elig.reason}</p>
            {new Date(elig.nextAllowedAt) > new Date() && (
              <p className="text-[#B45309] dark:text-[#FCD34D] mt-0.5">
                Next withdrawal available{' '}
                {new Date(elig.nextAllowedAt).toLocaleString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Africa/Kigali',
                })}
                .
              </p>
            )}
            {elig.plan.isFree && (
              <Link href="/plans" className="inline-flex items-center gap-1 mt-2 font-bold text-[#B45309] dark:text-[#FBBF24]">
                <Crown size={14} /> See plans that withdraw more often
              </Link>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] dark:bg-[#EF4444]/10 dark:border-[#EF4444]/30 p-3 flex gap-2 text-sm text-[#B91C1C] dark:text-[#F87171]">
          <AlertCircle size={18} className="shrink-0" /> {error}
        </div>
      )}

      <fieldset disabled={!elig?.canWithdraw} className="space-y-5 disabled:opacity-60">
        {/* Phone */}
        <div>
          <label htmlFor="phone" className="text-sm font-bold text-[#0F172A] dark:text-white">
            Mobile money number
          </label>
          <div className="relative mt-2">
            <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="078 123 4567"
              className={cn(input, 'pl-11 pr-28')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {provider && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold px-2 py-1 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] text-[#0F172A] dark:text-white">
                {MOBILE_MONEY_PROVIDERS[provider].label}
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5">
            {phone && !phoneValid ? 'Enter an MTN (078/079) or Airtel (072/073) number.' : 'Any MTN or Airtel Rwanda number. It can be different from your profile number.'}
          </p>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="text-sm font-bold text-[#0F172A] dark:text-white">
            Name on the account
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Jean Uwimana"
            className={cn(input, 'mt-2')}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="text-sm font-bold text-[#0F172A] dark:text-white">
            Amount
          </label>
          <div className="relative mt-2">
            <input
              id="amount"
              type="number"
              inputMode="numeric"
              min={min}
              max={balance}
              placeholder="0"
              className={cn(input, 'pr-16 text-2xl font-extrabold tabular-nums')}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#94A3B8]">RWF</span>
          </div>
          <p className={cn('text-xs mt-1.5', amountError ? 'text-[#DC2626]' : 'text-[#64748B] dark:text-[#94A3B8]')}>
            {amountError || `Minimum ${rwf(min)} · no fees`}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {quickAmounts.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(String(a))}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  amountNum === a
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#2563EB]',
                )}
              >
                {a.toLocaleString()}
              </button>
            ))}
            {balance >= min && (
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(balance)))}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  amountNum === Math.floor(balance)
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#2563EB]',
                )}
              >
                All
              </button>
            )}
          </div>
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => setStep('review')}
        disabled={!formValid}
        className="w-full bg-[#2563EB] text-white font-bold py-4 rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>

      {/* How payouts work */}
      <div className={cn(card, 'p-4 text-sm')}>
        <p className="font-bold text-[#0F172A] dark:text-white mb-2">How payouts work</p>
        <ul className="space-y-1.5 text-[#64748B] dark:text-[#94A3B8] text-xs">
          <li>• The amount is reserved from your balance as soon as you request.</li>
          <li>• All requests are paid together every day at {PAYOUT_TIME_LABEL}. Requests after {PAYOUT_TIME_LABEL} go out the next day.</li>
          <li>• Free plan: one withdrawal per week. Paid plans: one withdrawal every day.</li>
          <li>• If a payout can&apos;t be sent, the full amount returns to your balance.</li>
        </ul>
      </div>

      {/* Recent requests */}
      {history.length > 0 && (
        <div className={cn(card, 'p-4')}>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Your requests</p>
          <ul className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
            {history.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tabular-nums text-[#0F172A] dark:text-white">{rwf(w.amount)}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    {formatRwandaPhone(w.phoneNumber)} ·{' '}
                    {new Date(w.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {w.status === 'FAILED' && w.failureReason ? ` · ${w.failureReason}` : ''}
                  </p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg shrink-0', STATUS_UI[w.status]?.cls)}>
                  {STATUS_UI[w.status]?.label ?? w.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
