// src/components/app/MomoCheckout.tsx
//
// Pay for a plan by mobile money: send the price to Boostly's number, then
// submit the transaction ID + screenshot for an admin to confirm.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, ImagePlus, Loader2, Smartphone } from 'lucide-react';
import {
  detectMobileProvider,
  formatRwandaPhone,
  normalizeRwandaPhone,
} from '@/lib/constants/payouts';
import { cn } from '@/lib/utils';

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

interface MomoDetails {
  mtnNumber: string | null;
  airtelNumber: string | null;
  accountName: string | null;
  configured: boolean;
}

const input =
  'w-full rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-3 text-[15px] text-[#0F172A] dark:text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

function PayTo({ label, number, name }: { label: string; number: string; name: string | null }) {
  const [copied, setCopied] = useState(false);
  const local = formatRwandaPhone(number);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(local.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* select manually */
    }
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F172A] text-white">
        <Smartphone size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
        <p className="text-base font-bold tabular-nums text-[#0F172A] dark:text-white select-all">{local}</p>
        {name && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">Name: {name}</p>}
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg border border-[#E2E8F0] dark:border-[#334155] px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] dark:text-white"
      >
        {copied ? 'Copied' : <span className="inline-flex items-center gap-1"><Copy size={12} /> Copy</span>}
      </button>
    </div>
  );
}

export function MomoCheckout({
  planId,
  planName,
  amount,
  billingCycle,
  onSubmitted,
}: {
  planId: string;
  planName: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  onSubmitted: () => void;
}) {
  const [details, setDetails] = useState<MomoDetails | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [payerPhone, setPayerPhone] = useState('');
  const [txRef, setTxRef] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/api/payments/momo', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDetails)
      .catch(() => setLoadError(true));
  }, []);

  const preview = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const provider = detectMobileProvider(payerPhone);
  const phoneOk = normalizeRwandaPhone(payerPhone) !== null;
  const ready = phoneOk && txRef.trim().length >= 6 && !!file && !submitting;

  const submit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('planId', planId);
      form.set('billingCycle', billingCycle);
      form.set('payerPhone', payerPhone);
      form.set('transactionRef', txRef);
      form.set('proof', file);
      const res = await fetch('/api/plan-payments', { method: 'POST', body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not submit your payment.');
      setDone(true);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-4 rounded-xl bg-[#F0FDF4] dark:bg-[#22C55E]/10 p-5 text-center">
        <CheckCircle2 size={32} className="mx-auto text-[#16A34A]" />
        <p className="mt-2 font-bold text-[#0F172A] dark:text-white">Payment submitted</p>
        <p className="mt-1 text-sm text-[#475569] dark:text-[#CBD5E1]">
          We&apos;re checking your {rwf(amount)} payment. {planName} activates as soon as it&apos;s
          confirmed, and you&apos;ll get a notification.
        </p>
      </div>
    );
  }

  if (loadError || (details && !details.configured)) {
    return (
      <p className="mt-4 rounded-xl bg-[#FFFBEB] dark:bg-[#F59E0B]/10 p-4 text-sm text-[#92400E] dark:text-[#FBBF24]">
        Mobile money payments aren&apos;t available yet. Please try again later.
      </p>
    );
  }
  if (!details) {
    return (
      <div className="mt-4 flex justify-center py-6">
        <Loader2 className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-sm font-bold text-[#0F172A] dark:text-white">
          1. Send exactly {rwf(amount)} to:
        </p>
        <div className="mt-2 space-y-2">
          {details.mtnNumber && <PayTo label="MTN MoMo" number={details.mtnNumber} name={details.accountName} />}
          {details.airtelNumber && <PayTo label="Airtel Money" number={details.airtelNumber} name={details.accountName} />}
        </div>
        <p className="mt-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
          Check that the name shown on your phone matches before you confirm.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-[#0F172A] dark:text-white">2. Tell us about your payment</p>
        <div>
          <label htmlFor="payer" className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">
            Number you paid from
          </label>
          <input
            id="payer"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="078 123 4567"
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            className={cn(input, 'mt-1')}
          />
          {payerPhone && !phoneOk && (
            <p className="mt-1 text-xs text-[#DC2626]">Enter an MTN (078/079) or Airtel (072/073) number.</p>
          )}
          {provider && <p className="mt-1 text-xs text-[#64748B]">{provider === 'MTN' ? 'MTN MoMo' : 'Airtel Money'}</p>}
        </div>
        <div>
          <label htmlFor="txref" className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">
            Transaction ID (from the confirmation SMS)
          </label>
          <input
            id="txref"
            autoCapitalize="characters"
            placeholder="e.g. 12345678901"
            value={txRef}
            onChange={(e) => setTxRef(e.target.value)}
            className={cn(input, 'mt-1')}
          />
        </div>
        <div>
          <span className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Screenshot of the confirmation</span>
          <label
            className={cn(
              'mt-1 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-3',
              file ? 'border-[#22C55E] bg-[#F0FDF4] dark:bg-[#22C55E]/10' : 'border-[#CBD5E1] dark:border-[#475569]',
            )}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]">
                <ImagePlus size={20} />
              </span>
            )}
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-semibold text-[#0F172A] dark:text-white truncate">
                {file ? file.name : 'Add screenshot'}
              </span>
              <span className="block text-xs text-[#64748B]">JPG, PNG, WebP or PDF, up to 5 MB</span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-[#FEF2F2] dark:bg-[#EF4444]/10 p-3 text-sm text-[#B91C1C] dark:text-[#FCA5A5]">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!ready}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit payment for review'}
      </button>
      <p className="text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
        An admin checks the payment and activates your plan. Wrong or reused transaction IDs are rejected.
      </p>
    </div>
  );
}
