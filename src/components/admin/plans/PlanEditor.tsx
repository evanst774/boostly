// src/components/admin/plans/PlanEditor.tsx
// Side drawer for creating / editing a subscription plan. Fully dynamic:
// nothing here knows about the default tiers except the FREE plan rules
// that the server also enforces.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Lock,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  priceMonthly: number;
  priceYearly: number | null;
  dailyEarnings: number;
  features: string[];
  maxDailyVideos: number;
  maxDailyGames: number;
  maxDailySurveys: number;
  maxDailyAds: number;
  badgeBoost: number;
  priorityWithdrawal: boolean;
  vipSupport: boolean;
  withdrawalIntervalDays: number | null;
  sortOrder: number | null;
  isPopular: boolean | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  activeSubscribers: number;
}

export type PlanPayload = Partial<
  Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'activeSubscribers'>
>;

type IntervalMode = 'default' | 'daily' | 'weekly' | 'custom';

interface FormState {
  name: string;
  tier: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  dailyEarnings: string;
  features: string[];
  maxDailyVideos: string;
  maxDailyGames: string;
  maxDailySurveys: string;
  maxDailyAds: string;
  boostPct: string;
  priorityWithdrawal: boolean;
  vipSupport: boolean;
  intervalMode: IntervalMode;
  customDays: string;
  sortOrder: string;
  isPopular: boolean;
  isActive: boolean;
}

type Errors = Partial<Record<keyof FormState | 'form', string>>;

export type EditorMode =
  | { kind: 'create'; source?: Plan }
  | { kind: 'edit'; plan: Plan };

export const FREE_KEY = 'FREE';
const KEY_REGEX = /^[A-Z][A-Z0-9_]{1,31}$/;

// ─── Helpers ────────────────────────────────────────────────────────

export function formatRwf(value: number | null | undefined) {
  return `${Math.round(value ?? 0).toLocaleString('en-US')} RWF`;
}

const str = (n: number | null | undefined) =>
  n === null || n === undefined ? '' : String(n);

function intervalToForm(days: number | null): {
  intervalMode: IntervalMode;
  customDays: string;
} {
  if (days === null) return { intervalMode: 'default', customDays: '' };
  if (days === 1) return { intervalMode: 'daily', customDays: '' };
  if (days === 7) return { intervalMode: 'weekly', customDays: '' };
  return { intervalMode: 'custom', customDays: String(days) };
}

function suffixedKey(key: string, taken: Set<string>) {
  const base = `${key}_COPY`.slice(0, 32);
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${key.slice(0, 32 - 6 - String(i).length)}_COPY${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return base;
}

function planToForm(plan: Plan): FormState {
  return {
    name: plan.name,
    tier: plan.tier,
    description: plan.description ?? '',
    priceMonthly: str(plan.priceMonthly),
    priceYearly: str(plan.priceYearly),
    dailyEarnings: str(plan.dailyEarnings),
    features: plan.features.length ? [...plan.features] : [''],
    maxDailyVideos: str(plan.maxDailyVideos),
    maxDailyGames: str(plan.maxDailyGames),
    maxDailySurveys: str(plan.maxDailySurveys),
    maxDailyAds: str(plan.maxDailyAds),
    boostPct: str(Math.round((plan.badgeBoost || 0) * 1000) / 10),
    priorityWithdrawal: plan.priorityWithdrawal,
    vipSupport: plan.vipSupport,
    ...intervalToForm(plan.withdrawalIntervalDays),
    sortOrder: str(plan.sortOrder),
    isPopular: !!plan.isPopular,
    isActive: plan.isActive,
  };
}

function initialForm(mode: EditorMode, plans: Plan[]): FormState {
  if (mode.kind === 'edit') return planToForm(mode.plan);
  const taken = new Set(plans.map((p) => p.tier));
  const maxOrder = plans.reduce(
    (m, p, i) => Math.max(m, p.sortOrder ?? i * 10),
    -10,
  );
  const nextOrder = String(Math.min(10_000, maxOrder + 10));
  if (mode.source) {
    const f = planToForm(mode.source);
    return {
      ...f,
      name: `${mode.source.name} (copy)`.slice(0, 100),
      tier: suffixedKey(mode.source.tier, taken),
      // A copy of FREE is a paid plan; let the admin set the price.
      priceMonthly: mode.source.tier === FREE_KEY ? '' : f.priceMonthly,
      sortOrder: nextOrder,
      isPopular: false,
    };
  }
  return {
    name: '',
    tier: '',
    description: '',
    priceMonthly: '',
    priceYearly: '',
    dailyEarnings: '0',
    features: [''],
    maxDailyVideos: '10',
    maxDailyGames: '5',
    maxDailySurveys: '3',
    maxDailyAds: '10',
    boostPct: '0',
    priorityWithdrawal: false,
    vipSupport: false,
    intervalMode: 'default',
    customDays: '',
    sortOrder: nextOrder,
    isPopular: false,
    isActive: true,
  };
}

const parseNum = (v: string) => (v.trim() === '' ? NaN : Number(v));

function validate(
  f: FormState,
  mode: EditorMode,
  plans: Plan[],
): { errors: Errors; payload: PlanPayload | null } {
  const errors: Errors = {};
  const key = f.tier.trim().toUpperCase();
  const isFree = key === FREE_KEY;
  const editingId = mode.kind === 'edit' ? mode.plan.id : null;

  const name = f.name.trim();
  if (!name) errors.name = 'Give the plan a name.';
  else if (name.length > 100) errors.name = 'Keep the name under 100 characters.';

  if (!KEY_REGEX.test(key)) {
    errors.tier =
      'Use 2-32 capital letters, numbers or _, starting with a letter (e.g. GOLD_PLUS).';
  } else if (plans.some((p) => p.tier === key && p.id !== editingId)) {
    errors.tier = `Another plan already uses the key ${key}.`;
  }

  const monthly = parseNum(f.priceMonthly);
  if (!Number.isFinite(monthly) || monthly < 0) {
    errors.priceMonthly = 'Enter a monthly price in RWF.';
  } else if (isFree && monthly !== 0) {
    errors.priceMonthly = 'The Free plan must cost 0 RWF.';
  } else if (!isFree && monthly <= 0) {
    errors.priceMonthly = 'Paid plans need a monthly price above 0.';
  }

  let yearly: number | undefined;
  if (f.priceYearly.trim() !== '') {
    yearly = Number(f.priceYearly);
    if (!Number.isFinite(yearly) || yearly < 0) {
      errors.priceYearly = 'Enter 0 or more.';
    }
  } else if (mode.kind === 'edit' && mode.plan.priceYearly !== null) {
    errors.priceYearly = 'Enter a yearly price (0 if yearly billing is off).';
  }

  const daily = parseNum(f.dailyEarnings);
  if (!Number.isFinite(daily) || daily < 0 || daily > 10_000_000) {
    errors.dailyEarnings = 'Enter 0 (no maximum) up to 10,000,000.';
  }

  const intField = (k: keyof FormState, label: string) => {
    const n = parseNum(f[k] as string);
    if (!Number.isInteger(n) || n < 0 || n > 10_000) {
      errors[k] = `${label}: whole number 0-10,000.`;
      return 0;
    }
    return n;
  };
  const maxDailyVideos = intField('maxDailyVideos', 'Videos');
  const maxDailyGames = intField('maxDailyGames', 'Games');
  const maxDailySurveys = intField('maxDailySurveys', 'Surveys');
  const maxDailyAds = intField('maxDailyAds', 'Ads');

  const boost = parseNum(f.boostPct);
  if (!Number.isFinite(boost) || boost < 0 || boost > 500) {
    errors.boostPct = 'Enter a boost between 0% and 500%.';
  }

  let withdrawalIntervalDays: number | null = null;
  if (f.intervalMode === 'daily') withdrawalIntervalDays = 1;
  else if (f.intervalMode === 'weekly') withdrawalIntervalDays = 7;
  else if (f.intervalMode === 'custom') {
    const d = parseNum(f.customDays);
    if (!Number.isInteger(d) || d < 1 || d > 90) {
      errors.customDays = 'Enter whole days between 1 and 90.';
    } else withdrawalIntervalDays = d;
  }

  let sortOrder: number | null = null;
  if (f.sortOrder.trim() !== '') {
    const s = Number(f.sortOrder);
    if (!Number.isInteger(s) || s < 0 || s > 10_000) {
      errors.sortOrder = 'Whole number 0-10,000, or leave blank.';
    } else sortOrder = s;
  }

  if (isFree && !f.isActive) {
    errors.isActive = 'The Free plan is always offered and cannot be hidden.';
  }

  if (Object.keys(errors).length) return { errors, payload: null };

  const full: PlanPayload = {
    name,
    tier: key,
    description: f.description.trim(),
    priceMonthly: monthly,
    ...(yearly !== undefined ? { priceYearly: yearly } : {}),
    dailyEarnings: daily,
    features: f.features.map((s) => s.trim()).filter(Boolean),
    maxDailyVideos,
    maxDailyGames,
    maxDailySurveys,
    maxDailyAds,
    badgeBoost: Math.round(boost * 10) / 1000,
    priorityWithdrawal: f.priorityWithdrawal,
    vipSupport: f.vipSupport,
    withdrawalIntervalDays,
    sortOrder,
    isPopular: f.isPopular,
    isActive: f.isActive,
  };

  if (mode.kind === 'create') return { errors, payload: full };

  // PATCH: send only what changed.
  const original = mode.plan;
  const diff: PlanPayload = {};
  (Object.keys(full) as (keyof PlanPayload)[]).forEach((k) => {
    const before =
      k === 'description'
        ? (original.description ?? '')
        : k === 'isPopular'
          ? !!original.isPopular
          : original[k];
    if (JSON.stringify(before) !== JSON.stringify(full[k])) {
      (diff as Record<string, unknown>)[k] = full[k];
    }
  });
  return { errors, payload: diff };
}

// ─── Small UI pieces ────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-60';

function Field({
  label,
  htmlFor,
  helper,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  helper?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-[#0F172A] dark:text-white"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-[#EF4444]">
          <AlertCircle size={13} className="mt-px shrink-0" />
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#E2E8F0] px-5 py-5 last:border-b-0 dark:border-[#334155] sm:px-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A] dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-0.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
          {description}
        </p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="flex w-full items-start justify-between gap-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>
          <span className="block text-sm font-medium text-[#0F172A] dark:text-white">
            {label}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs text-[#64748B] dark:text-[#94A3B8]">
              {description}
            </span>
          )}
        </span>
        <span
          className={cn(
            'relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
            checked ? 'bg-[#2563EB]' : 'bg-[#CBD5E1] dark:bg-[#475569]',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              checked ? 'translate-x-[22px]' : 'translate-x-0.5',
            )}
          />
        </span>
      </button>
      {error && (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-[#EF4444]">
          <AlertCircle size={13} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Editor ─────────────────────────────────────────────────────────

export function PlanEditor({
  mode,
  plans,
  onClose,
  onSave,
}: {
  mode: EditorMode;
  plans: Plan[];
  onClose: () => void;
  /** Returns an error message to show, or null on success. */
  onSave: (payload: PlanPayload) => Promise<string | null>;
}) {
  const [form, setForm] = useState<FormState>(() => initialForm(mode, plans));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = mode.kind === 'edit';
  const editingFree = isEdit && mode.plan.tier === FREE_KEY;
  const keyIsFree = form.tier.trim().toUpperCase() === FREE_KEY;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // Re-validate live once the admin has tried to save.
  useEffect(() => {
    if (submitted) setErrors(validate(form, mode, plans).errors);
  }, [form, submitted, mode, plans]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const title = isEdit
    ? `Edit ${mode.plan.name}`
    : mode.source
      ? `Duplicate ${mode.source.name}`
      : 'New plan';

  const suggestedYearly = useMemo(() => {
    const m = parseNum(form.priceMonthly);
    return Number.isFinite(m) && m >= 0 ? m * 10 : null;
  }, [form.priceMonthly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    const { errors: errs, payload } = validate(form, mode, plans);
    setErrors(errs);
    if (!payload) return;
    if (isEdit && Object.keys(payload).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    const err = await onSave(payload);
    setSaving(false);
    if (err) setServerError(err);
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.22 }}
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-[#1E293B]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-5 py-4 dark:border-[#334155] sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[#0F172A] dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {isEdit
                ? `${mode.plan.activeSubscribers} active subscriber${mode.plan.activeSubscribers === 1 ? '' : 's'} · changes apply right away`
                : 'Members see new plans as soon as they are active.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9] disabled:opacity-50 dark:text-[#94A3B8] dark:hover:bg-[#334155]"
          >
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            {serverError && (
              <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C] dark:text-[#FCA5A5] sm:mx-6">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Section title="Basics">
              <Field label="Plan name" htmlFor="plan-name" error={errors.name}>
                <input
                  id="plan-name"
                  className={inputCls}
                  value={form.name}
                  maxLength={100}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Gold Plus"
                />
              </Field>
              <Field
                label="Plan key"
                htmlFor="plan-key"
                error={errors.tier}
                helper={
                  editingFree ? (
                    <span className="inline-flex items-center gap-1">
                      <Lock size={12} /> The Free plan key can&apos;t change.
                    </span>
                  ) : isEdit ? (
                    'Unique ID used by subscriptions. Changing it is rarely needed.'
                  ) : (
                    'Unique ID, e.g. GOLD_PLUS. Capital letters, numbers and _.'
                  )
                }
              >
                <input
                  id="plan-key"
                  className={cn(inputCls, 'font-mono uppercase')}
                  value={form.tier}
                  maxLength={32}
                  disabled={editingFree}
                  onChange={(e) =>
                    set(
                      'tier',
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
                    )
                  }
                  placeholder="GOLD_PLUS"
                />
              </Field>
              <Field label="Description" htmlFor="plan-desc">
                <textarea
                  id="plan-desc"
                  rows={2}
                  className={cn(inputCls, 'resize-none')}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="One line members see under the plan name"
                />
              </Field>
            </Section>

            <Section title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Monthly price (RWF)"
                  htmlFor="plan-monthly"
                  error={errors.priceMonthly}
                  helper={keyIsFree ? 'The Free plan always costs 0.' : undefined}
                >
                  <input
                    id="plan-monthly"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    className={inputCls}
                    value={form.priceMonthly}
                    disabled={editingFree}
                    onChange={(e) => set('priceMonthly', e.target.value)}
                    placeholder={keyIsFree ? '0' : 'e.g. 5000'}
                  />
                </Field>
                <Field
                  label="Yearly price (RWF)"
                  htmlFor="plan-yearly"
                  error={errors.priceYearly}
                  helper={
                    suggestedYearly !== null && !keyIsFree ? (
                      <button
                        type="button"
                        onClick={() =>
                          set('priceYearly', String(suggestedYearly))
                        }
                        className="inline-flex items-center gap-1 font-medium text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA]"
                      >
                        <Sparkles size={12} /> Auto = monthly × 10 (
                        {formatRwf(suggestedYearly)})
                      </button>
                    ) : (
                      'Optional.'
                    )
                  }
                >
                  <input
                    id="plan-yearly"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    className={inputCls}
                    value={form.priceYearly}
                    onChange={(e) => set('priceYearly', e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Daily earning">
              <Field
                label="Max earnings per day (RWF)"
                htmlFor="plan-daily"
                error={errors.dailyEarnings}
                helper="A ceiling, not a promise. Rewards are paid from sponsor budgets. 0 = no maximum."
              >
                <input
                  id="plan-daily"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10}
                  className={inputCls}
                  value={form.dailyEarnings}
                  onChange={(e) => set('dailyEarnings', e.target.value)}
                />
              </Field>
            </Section>

            <Section
              title="Daily tasks"
              description="How many of each task a member can complete per day."
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(
                  [
                    ['maxDailyVideos', 'Videos'],
                    ['maxDailyGames', 'Games'],
                    ['maxDailySurveys', 'Surveys'],
                    ['maxDailyAds', 'Ads'],
                  ] as const
                ).map(([k, label]) => (
                  <Field
                    key={k}
                    label={label}
                    htmlFor={`plan-${k}`}
                    error={errors[k]}
                  >
                    <input
                      id={`plan-${k}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      className={inputCls}
                      value={form[k]}
                      onChange={(e) => set(k, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
            </Section>

            <Section title="Rewards & withdrawals">
              <Field
                label="Reward boost per task (%)"
                htmlFor="plan-boost"
                error={errors.boostPct}
                helper="Extra on every task reward. 30 = +30%."
              >
                <div className="relative">
                  <input
                    id="plan-boost"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={500}
                    step={5}
                    className={cn(inputCls, 'pr-9')}
                    value={form.boostPct}
                    onChange={(e) => set('boostPct', e.target.value)}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-[#64748B] dark:text-[#94A3B8]">
                    %
                  </span>
                </div>
              </Field>

              <Field
                label="Withdrawal frequency"
                error={errors.customDays}
                helper={
                  form.intervalMode === 'default'
                    ? `Default: ${keyIsFree ? 'once a week' : 'every day'}.`
                    : 'Payouts go to MoMo at 3 PM Kigali time.'
                }
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ['default', 'Default'],
                      ['daily', 'Every day'],
                      ['weekly', 'Once a week'],
                      ['custom', 'Custom'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('intervalMode', value)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-medium transition',
                        form.intervalMode === value
                          ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA]'
                          : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] dark:border-[#334155] dark:text-[#94A3B8] dark:hover:border-[#475569]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {form.intervalMode === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                      Every
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={90}
                      aria-label="Days between withdrawals"
                      className={cn(inputCls, 'w-24')}
                      value={form.customDays}
                      onChange={(e) => set('customDays', e.target.value)}
                      placeholder="3"
                    />
                    <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                      days (1-90)
                    </span>
                  </div>
                )}
              </Field>

              <Toggle
                checked={form.priorityWithdrawal}
                onChange={(v) => set('priorityWithdrawal', v)}
                label="Priority withdrawal"
                description="Paid first in the 3 PM payout run."
              />
              <Toggle
                checked={form.vipSupport}
                onChange={(v) => set('vipSupport', v)}
                label="VIP support"
                description="Faster replies from the support team."
              />
            </Section>

            <Section title="Display">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F172A] dark:text-white">
                    Features
                  </span>
                  <button
                    type="button"
                    onClick={() => set('features', [...form.features, ''])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA]"
                  >
                    <Plus size={13} /> Add feature
                  </button>
                </div>
                <div className="space-y-2">
                  {form.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        aria-label={`Feature ${i + 1}`}
                        className={inputCls}
                        value={feature}
                        onChange={(e) =>
                          set(
                            'features',
                            form.features.map((f, j) =>
                              j === i ? e.target.value : f,
                            ),
                          )
                        }
                        placeholder="e.g. Up to 20 videos a day"
                      />
                      <button
                        type="button"
                        aria-label={`Remove feature ${i + 1}`}
                        onClick={() =>
                          set(
                            'features',
                            form.features.length > 1
                              ? form.features.filter((_, j) => j !== i)
                              : [''],
                          )
                        }
                        className="shrink-0 rounded-lg p-2 text-[#64748B] transition hover:bg-[#EF4444]/10 hover:text-[#EF4444] dark:text-[#94A3B8]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Empty rows are ignored.
                </p>
              </div>

              <Field
                label="Sort order"
                htmlFor="plan-sort"
                error={errors.sortOrder}
                helper="Lower numbers show first. Blank = after numbered plans."
              >
                <input
                  id="plan-sort"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10}
                  className={cn(inputCls, 'sm:w-40')}
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', e.target.value)}
                />
              </Field>

              <Toggle
                checked={form.isPopular}
                onChange={(v) => set('isPopular', v)}
                label="Most popular"
                description="Highlights this plan on the plans page."
              />
              <Toggle
                checked={form.isActive}
                onChange={(v) => set('isActive', v)}
                label="Active"
                description={
                  keyIsFree
                    ? 'The Free plan is always offered.'
                    : 'Hidden plans are not offered to members. Current subscribers keep them.'
                }
                disabled={keyIsFree && form.isActive}
                error={errors.isActive}
              />
            </Section>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-[#E2E8F0] px-5 py-4 dark:border-[#334155] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-[#EF4444]">
              {errorCount > 0 &&
                `Fix ${errorCount} field${errorCount === 1 ? '' : 's'} above.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC] disabled:opacity-50 dark:border-[#334155] dark:text-white dark:hover:bg-[#334155] sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create plan'}
              </button>
            </div>
          </footer>
        </form>
      </motion.aside>
    </div>
  );
}
