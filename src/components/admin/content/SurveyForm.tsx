// src/components/admin/content/SurveyForm.tsx
'use client';

import { PlanAccessField } from '@/components/admin/content/PlanAccessField';
import { useState } from 'react';
import { Save, Loader2, Plus, Trash2, GripVertical, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AVERAGE_BOOST_ESTIMATE,
  Callout,
  FieldError,
  FieldHint,
  FieldLabel,
  FormBanner,
  estimatePaidCompletions,
  fieldInputClass,
  focusFirstError,
  isValidUrl,
  parseServerError,
  type FieldErrors,
} from './FieldHelp';

export type SurveyQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'rating'
  | 'likert'
  | 'text';

export interface SurveyQuestionDraft {
  question: string;
  description: string;
  type: SurveyQuestionType;
  options: string[];
  required: boolean;
}

export interface SurveyFormValues {
  title: string;
  description: string;
  brand: string;
  brandLogo: string;
  category: string;
  estimatedTime: number;
  rewardAmount: number;
  rewardBudget: number | null;
  allowedPlanTiers: string[] | null;
  maxParticipants: number | '';
  isSponsored: boolean;
  sponsorName: string;
  sponsorLogo: string;
  sponsorWebsite: string;
  /** ISO date-time; blank/undefined = not set. */
  startsAt?: string | null;
  /** ISO date-time; after it, members no longer see the survey. */
  endsAt?: string | null;
  questions: SurveyQuestionDraft[];
}

export const EMPTY_QUESTION: SurveyQuestionDraft = {
  question: '',
  description: '',
  type: 'single_choice',
  options: ['', ''],
  required: true,
};

export const EMPTY_SURVEY_FORM: SurveyFormValues = {
  title: '',
  description: '',
  brand: '',
  brandLogo: '',
  category: 'TECHNOLOGY',
  estimatedTime: 5,
  rewardAmount: 200,
  rewardBudget: null,
  allowedPlanTiers: null,
  maxParticipants: '',
  isSponsored: false,
  sponsorName: '',
  sponsorLogo: '',
  sponsorWebsite: '',
  questions: [{ ...EMPTY_QUESTION }],
};

const CATEGORIES = [
  'TECHNOLOGY',
  'SHOPPING',
  'FINANCE',
  'HEALTHCARE',
  'EDUCATION',
  'ENTERTAINMENT',
  'LIFESTYLE',
  'TELECOMMUNICATIONS',
  'RETAIL',
  'BANKING',
];

const QUESTION_TYPES: SurveyQuestionType[] = [
  'single_choice',
  'multiple_choice',
  'rating',
  'likert',
  'text',
];

/** The five answers the member app shows for agree/disagree questions. */
const LIKERT_OPTIONS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

const QUESTION_TYPE_INFO: Record<SurveyQuestionType, { label: string; help: string }> = {
  single_choice: {
    label: 'Single choice',
    help: 'Members pick exactly one option. Add at least 2 options.',
  },
  multiple_choice: {
    label: 'Multiple choice',
    help: 'Members "choose all that apply" (one or more). Add at least 2 options.',
  },
  rating: {
    label: 'Rating (1–10)',
    help: 'Members pick a number from 1 to 10. No options needed.',
  },
  likert: {
    label: 'Agree / disagree',
    help: 'Likert scale with 5 fixed answers, from Strongly disagree to Strongly agree. Write the question as a statement.',
  },
  text: {
    label: 'Text answer',
    help: 'Members type a free answer (at least 2 characters, up to 1000). No options needed.',
  },
};

const needsOptions = (t: SurveyQuestionType) =>
  t === 'single_choice' || t === 'multiple_choice';

/** Same rule as the server: 3 seconds per question, at least 8 seconds. */
const minSurveySeconds = (count: number) => Math.max(8, count * 3);
/** Realistic pace for the estimate shown to members (about 20 s a question). */
const suggestedMinutes = (count: number) => Math.max(1, Math.ceil((count * 20) / 60));

const LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  brand: 'Brand',
  brandLogo: 'Brand logo',
  category: 'Category',
  estimatedTime: 'Estimated time',
  rewardAmount: 'Reward',
  rewardBudget: 'Reward budget',
  allowedPlanTiers: 'Available to',
  maxParticipants: 'Max participants',
  questionsCount: 'Questions',
  questions: 'Questions',
  sponsorName: 'Sponsor name',
  sponsorLogo: 'Sponsor logo',
  sponsorWebsite: 'Sponsor website',
  startsAt: 'Start date',
  endsAt: 'End date',
};

const BASE_ORDER = [
  'title',
  'brand',
  'description',
  'category',
  'rewardAmount',
  'rewardBudget',
  'estimatedTime',
  'maxParticipants',
  'startsAt',
  'endsAt',
  'sponsorName',
  'sponsorLogo',
  'sponsorWebsite',
  'questions',
];

// ---------- date helpers (datetime-local <-> ISO) ----------

function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const isPast = (iso: string | null | undefined) =>
  !!iso && !Number.isNaN(new Date(iso).getTime()) && new Date(iso).getTime() <= Date.now();

// ---------- validation ----------

function validate(form: SurveyFormValues, initialEndsAt: string | null | undefined): FieldErrors {
  const e: FieldErrors = {};
  if (!form.title.trim()) e.title = 'Give the survey a title.';
  else if (form.title.length > 255) e.title = 'Keep the title to 255 characters or fewer.';
  if (!form.brand.trim()) e.brand = 'Enter the brand or company running the survey.';

  if (!(form.rewardAmount > 0)) e.rewardAmount = 'Enter a reward greater than 0 RWF.';
  if (form.rewardBudget !== null && !(form.rewardBudget > 0))
    e.rewardBudget = 'Enter a budget greater than 0, or leave it blank for no campaign limit.';
  if (!Number.isInteger(form.estimatedTime) || form.estimatedTime < 1)
    e.estimatedTime = 'Enter whole minutes, 1 or more.';
  if (
    form.maxParticipants !== '' &&
    (!Number.isInteger(form.maxParticipants) || form.maxParticipants < 1)
  )
    e.maxParticipants = 'Enter a whole number, or leave it blank.';

  if (form.endsAt) {
    if (isPast(form.endsAt))
      e.endsAt = "This end date is in the past, so members won't see the survey. Pick a future date.";
    else if (form.startsAt && new Date(form.endsAt) <= new Date(form.startsAt))
      e.endsAt = 'The end date must be after the start date.';
  } else if (initialEndsAt) {
    e.endsAt =
      "A saved end date can't be removed here. Pick a new future end date instead.";
  }

  if (form.isSponsored) {
    if (!form.sponsorName.trim()) e.sponsorName = 'Sponsored surveys need the sponsor name.';
    if (!form.sponsorWebsite.trim())
      e.sponsorWebsite = 'Sponsored surveys need the sponsor website (for example mtn.co.rw).';
    else if (!isValidUrl(form.sponsorWebsite))
      e.sponsorWebsite = 'Enter a website like mtn.co.rw or https://www.mtn.co.rw.';
    if (form.sponsorLogo.trim() && !isValidUrl(form.sponsorLogo))
      e.sponsorLogo = 'Enter a valid image link, or leave it blank.';
  }

  if (form.questions.length === 0) e.questions = 'Add at least one question.';
  form.questions.forEach((q, i) => {
    if (!q.question.trim()) e[`q-${i}-question`] = 'Write the question.';
    if (needsOptions(q.type)) {
      const filled = q.options.map((o) => o.trim()).filter(Boolean);
      const lower = filled.map((o) => o.toLowerCase());
      if (filled.length < 2)
        e[`q-${i}-options`] = `${QUESTION_TYPE_INFO[q.type].label} needs at least 2 options (${filled.length} filled in).`;
      else if (new Set(lower).size !== lower.length)
        e[`q-${i}-options`] = 'Two options are the same. Each option must be different.';
    }
  });
  return e;
}

/** Final per-type options, matching what the member app sends back. */
function normalizeQuestion(q: SurveyQuestionDraft): SurveyQuestionDraft {
  if (q.type === 'likert') return { ...q, options: [...LIKERT_OPTIONS] };
  if (q.type === 'rating' || q.type === 'text') return { ...q, options: [] };
  return { ...q, options: q.options.map((o) => o.trim()).filter(Boolean) };
}

const DATE_KEYS = new Set(['startsAt', 'endsAt', 'sponsoredUntil']);

/**
 * Drops null values the server can't accept (e.g. an empty sponsoredUntil
 * loaded from the database) and sends dates as full ISO strings.
 * rewardBudget keeps null: it means "no limit".
 */
function withoutNulls(values: SurveyFormValues): SurveyFormValues {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if ((v === null || v === '') && k !== 'rewardBudget' && k !== 'allowedPlanTiers' && (v === null || DATE_KEYS.has(k))) continue;
    if (DATE_KEYS.has(k) && typeof v === 'string') {
      const d = new Date(v);
      out[k] = Number.isNaN(d.getTime()) ? v : d.toISOString();
      continue;
    }
    out[k] = v;
  }
  return out as unknown as SurveyFormValues;
}

interface SurveyFormProps {
  initialValues: SurveyFormValues;
  submitLabel: string;
  onSubmit: (values: SurveyFormValues) => Promise<void>;
}

export function SurveyForm({
  initialValues,
  submitLabel,
  onSubmit,
}: SurveyFormProps) {
  const [form, setForm] = useState<SurveyFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const initialEndsAt = initialValues.endsAt;

  const clearError = (key: string) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const set = <K extends keyof SurveyFormValues>(
    field: K,
    value: SurveyFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const setQuestion = (index: number, patch: Partial<SurveyQuestionDraft>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    }));
    if (patch.question !== undefined) clearError(`q-${index}-question`);
    if (patch.type !== undefined || patch.options !== undefined) clearError(`q-${index}-options`);
  };

  const changeType = (index: number, type: SurveyQuestionType) => {
    const current = form.questions[index];
    let options = current.options;
    if (type === 'likert') options = [...LIKERT_OPTIONS];
    else if (
      needsOptions(type) &&
      (current.type === 'likert' || options.filter((o) => o.trim()).length === 0)
    )
      options = ['', ''];
    setQuestion(index, { type, options });
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...EMPTY_QUESTION, options: ['', ''] }],
    }));
    clearError('questions');
  };

  const removeQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
    // Question error keys are index-based; clear them so they don't shift.
    setErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith('q-'))),
    );
  };

  const setOption = (qIndex: number, oIndex: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q,
      ),
    }));
    clearError(`q-${qIndex}-options`);
  };

  const addOption = (qIndex: number) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, ''] } : q,
      ),
    }));

  const removeOption = (qIndex: number, oIndex: number) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.filter((_, j) => j !== oIndex) }
          : q,
      ),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const found = validate(form, initialEndsAt);
    const count = Object.values(found).filter(Boolean).length;
    const order = [
      ...BASE_ORDER,
      ...form.questions.flatMap((_, i) => [`q-${i}-question`, `q-${i}-options`]),
    ];
    if (count > 0) {
      setErrors(found);
      setError(
        count === 1
          ? 'Please fix the highlighted field before saving.'
          : `Please fix the ${count} highlighted fields before saving.`,
      );
      focusFirstError(found, order);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(
        withoutNulls({ ...form, questions: form.questions.map(normalizeQuestion) }),
      );
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const parsed = parseServerError(raw || 'Failed to save survey', LABELS);
      if (parsed.field && parsed.field in LABELS) {
        const key = parsed.field === 'questionsCount' ? 'questions' : parsed.field;
        setErrors((prev) => ({ ...prev, [key]: parsed.text }));
        focusFirstError({ [key]: parsed.text }, order);
      }
      setError(parsed.banner);
    } finally {
      setSaving(false);
    }
  };

  const qCount = form.questions.length;
  const minSeconds = minSurveySeconds(qCount);
  const suggested = suggestedMinutes(qCount);
  const timeLooksShort = qCount > 0 && form.estimatedTime * 60 < qCount * 10;
  const timeLooksLong = qCount > 0 && form.estimatedTime > suggested * 3 && form.estimatedTime > 3;
  const paidCompletions = estimatePaidCompletions(form.rewardBudget, form.rewardAmount);
  const endedAlready = isPast(form.endsAt);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6 space-y-6">
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Fields marked <span className="text-[#EF4444]">*</span> are required. Press the{' '}
          <span className="font-semibold">?</span> next to a label for more detail.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FieldLabel htmlFor="field-title" required>
              Title
            </FieldLabel>
            <input
              id="field-title"
              maxLength={255}
              className={fieldInputClass(!!errors.title)}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. How do you pay for groceries?"
            />
            <FieldError message={errors.title} />
            <FieldHint>What the survey is about, as members see it on the card.</FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-brand"
              required
              tip={
                <p>
                  The company asking the questions, shown on the survey card. If a different
                  company paid for the rewards, also turn on Sponsored below.
                </p>
              }
            >
              Brand
            </FieldLabel>
            <input
              id="field-brand"
              className={fieldInputClass(!!errors.brand)}
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="e.g. MTN Rwanda"
            />
            <FieldError message={errors.brand} />
            <FieldHint>Brand or company running the survey.</FieldHint>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="field-description">Description</FieldLabel>
          <textarea
            id="field-description"
            className={fieldInputClass(!!errors.description, 'resize-none h-20')}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Why you are asking and how the answers will be used"
          />
          <FieldError message={errors.description} />
          <FieldHint>Optional. One or two sentences on why you are asking.</FieldHint>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <FieldLabel htmlFor="field-category" required>
              Category
            </FieldLabel>
            <select
              id="field-category"
              className={fieldInputClass(!!errors.category)}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError message={errors.category} />
            <FieldHint>Members can filter surveys by category.</FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-rewardAmount"
              required
              tip={
                <p>
                  Base RWF paid once per member for a completed survey. Plan boosts and badges add
                  to it. A member can complete each survey only once.
                </p>
              }
            >
              Reward (RWF)
            </FieldLabel>
            <input
              id="field-rewardAmount"
              type="number"
              min={1}
              className={fieldInputClass(!!errors.rewardAmount)}
              value={form.rewardAmount}
              onChange={(e) => set('rewardAmount', Number(e.target.value))}
            />
            <FieldError message={errors.rewardAmount} />
            <FieldHint>Paid per completion, before plan boosts.</FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-rewardBudget"
              tip={
                <>
                  <p>
                    What the sponsor paid for rewards on this survey. Every payout (including plan
                    boosts) is taken from it, and payouts stop when it is used up.
                  </p>
                  <p>Leave blank for no campaign limit; the daily platform budget still applies.</p>
                </>
              }
            >
              Reward budget (RWF)
            </FieldLabel>
            <input
              id="field-rewardBudget"
              type="number"
              min={1}
              placeholder="No campaign limit"
              className={fieldInputClass(!!errors.rewardBudget)}
              value={form.rewardBudget ?? ''}
              onChange={(e) => set('rewardBudget', e.target.value ? Number(e.target.value) : null)}
            />
            <FieldError message={errors.rewardBudget} />
            {paidCompletions !== null && !errors.rewardBudget && (
              <p className="mt-1 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                ≈ {paidCompletions.toLocaleString()} paid completions (estimate, assuming an average
                plan boost of about {AVERAGE_BOOST_ESTIMATE}×)
              </p>
            )}
            <FieldHint>
              Payouts stop when the budget is used up. Leave blank for no campaign limit (the daily
              platform budget still applies).
            </FieldHint>
          </div>
          <PlanAccessField
            value={form.allowedPlanTiers}
            onChange={(v) => set('allowedPlanTiers', v)}
          />
          <div>
            <FieldLabel
              htmlFor="field-estimatedTime"
              required
              tip={
                <p>
                  Shown to members before they start. Members can&apos;t submit until at least 3
                  seconds per question have passed (minimum 8 s), so quick tapping is rejected.
                  Real people take about 15–20 seconds per question; estimate honestly.
                </p>
              }
            >
              Est. Time (min)
            </FieldLabel>
            <input
              id="field-estimatedTime"
              type="number"
              min={1}
              className={fieldInputClass(!!errors.estimatedTime)}
              value={form.estimatedTime}
              onChange={(e) => set('estimatedTime', Number(e.target.value))}
            />
            <FieldError message={errors.estimatedTime} />
            {!errors.estimatedTime && (timeLooksShort || timeLooksLong) && (
              <p className="mt-1 text-xs text-[#B45309] dark:text-[#FBBF24]">
                {timeLooksShort ? 'Looks too short' : 'Looks long'} for {qCount} question
                {qCount === 1 ? '' : 's'}; about {suggested} min is realistic.
                <button
                  type="button"
                  onClick={() => set('estimatedTime', suggested)}
                  className="ml-1 font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                >
                  Use {suggested} min
                </button>
              </p>
            )}
            <FieldHint>
              Members need at least {minSeconds} s ({qCount} question{qCount === 1 ? '' : 's'} × 3
              s, min 8 s) before submitting; about {suggested} min is realistic.
            </FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-maxParticipants"
              tip={
                <p>
                  Target number of responses, used for the progress figure in admin. It is not a
                  hard stop; use the reward budget to cap spending.
                </p>
              }
            >
              Max Participants
            </FieldLabel>
            <input
              id="field-maxParticipants"
              type="number"
              min={1}
              placeholder="Unlimited"
              className={fieldInputClass(!!errors.maxParticipants)}
              value={form.maxParticipants}
              onChange={(e) =>
                set(
                  'maxParticipants',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
            />
            <FieldError message={errors.maxParticipants} />
            <FieldHint>Optional response target. Leave blank for unlimited.</FieldHint>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FieldLabel
              htmlFor="field-startsAt"
              tip={
                <p>
                  For your records. Members see a survey as soon as it is Active; publishing sets
                  the start date to the moment it goes live.
                </p>
              }
            >
              Start date
            </FieldLabel>
            <input
              id="field-startsAt"
              type="datetime-local"
              className={fieldInputClass(!!errors.startsAt)}
              value={isoToLocalInput(form.startsAt)}
              onChange={(e) => set('startsAt', localInputToIso(e.target.value))}
            />
            <FieldError message={errors.startsAt} />
            <FieldHint>Optional. Publishing sets it to the go-live time.</FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-endsAt"
              tip={
                <p>
                  After this moment the survey disappears for members and can&apos;t be started.
                  It must be in the future, or members won&apos;t see the survey at all. Leave
                  blank to keep it open until you unpublish it.
                </p>
              }
            >
              End date
            </FieldLabel>
            <input
              id="field-endsAt"
              type="datetime-local"
              className={fieldInputClass(!!errors.endsAt || endedAlready)}
              value={isoToLocalInput(form.endsAt)}
              onChange={(e) => set('endsAt', localInputToIso(e.target.value))}
            />
            <FieldError message={errors.endsAt} />
            {!errors.endsAt && endedAlready && form.endsAt && (
              <Callout tone="warning" className="mt-2">
                This survey ended on {formatDate(form.endsAt)}, so members can&apos;t see it. Pick
                a future end date to reopen it.
              </Callout>
            )}
            <FieldHint>
              Optional. Must be in the future; members stop seeing the survey after it.
            </FieldHint>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.isSponsored}
            aria-label="Sponsored"
            onClick={() => set('isSponsored', !form.isSponsored)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative flex-shrink-0',
              form.isSponsored ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                form.isSponsored ? 'right-0.5' : 'left-0.5',
              )}
            />
          </button>
          <div>
            <span className="text-sm font-medium text-[#0F172A] dark:text-white">Sponsored</span>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Turn on when a brand paid for this survey. Sponsor name and website are then
              required.
            </p>
          </div>
        </div>

        {form.isSponsored && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <FieldLabel htmlFor="field-sponsorName" required>
                Sponsor Name
              </FieldLabel>
              <input
                id="field-sponsorName"
                className={fieldInputClass(!!errors.sponsorName)}
                value={form.sponsorName}
                onChange={(e) => set('sponsorName', e.target.value)}
                placeholder="e.g. MTN Rwanda"
              />
              <FieldError message={errors.sponsorName} />
              <FieldHint>Brand name shown as the sponsor.</FieldHint>
            </div>
            <div>
              <FieldLabel htmlFor="field-sponsorLogo">Sponsor Logo URL</FieldLabel>
              <input
                id="field-sponsorLogo"
                inputMode="url"
                className={fieldInputClass(!!errors.sponsorLogo)}
                value={form.sponsorLogo}
                onChange={(e) => set('sponsorLogo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <FieldError message={errors.sponsorLogo} />
              <FieldHint>Optional square logo image link.</FieldHint>
            </div>
            <div>
              <FieldLabel htmlFor="field-sponsorWebsite" required>
                Sponsor Website
              </FieldLabel>
              <input
                id="field-sponsorWebsite"
                inputMode="url"
                className={fieldInputClass(!!errors.sponsorWebsite)}
                value={form.sponsorWebsite}
                onChange={(e) => set('sponsorWebsite', e.target.value)}
                placeholder="mtn.co.rw"
              />
              <FieldError message={errors.sponsorWebsite} />
              <FieldHint>A plain domain like mtn.co.rw is fine.</FieldHint>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
              Questions ({qCount})
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Members answer in this order. Keep questions short and neutral.
            </p>
          </div>
          <button
            type="button"
            onClick={addQuestion}
            className="px-3 py-1.5 rounded-lg bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus size={14} />
            Add Question
          </button>
        </div>

        <Callout tone="info">
          <p className="font-semibold">Question types</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {QUESTION_TYPES.map((t) => (
              <li key={t}>
                <span className="font-medium">{QUESTION_TYPE_INFO[t].label}:</span>{' '}
                {QUESTION_TYPE_INFO[t].help}
              </li>
            ))}
          </ul>
        </Callout>

        <div id="field-questions" tabIndex={-1}>
          <FieldError message={errors.questions} />
        </div>

        {form.questions.map((q, qIndex) => {
          const optionsError = errors[`q-${qIndex}-options`];
          const questionError = errors[`q-${qIndex}-question`];
          return (
            <div
              key={qIndex}
              className={cn(
                'p-4 rounded-xl border space-y-3',
                questionError || optionsError
                  ? 'border-[#FECACA] dark:border-[#EF4444]/40'
                  : 'border-[#F1F5F9] dark:border-[#334155]',
              )}
            >
              <div className="flex items-start gap-2">
                <GripVertical size={16} className="mt-3 text-[#94A3B8] flex-shrink-0" />
                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <FieldLabel htmlFor={`field-q-${qIndex}-question`} required>
                      Question {qIndex + 1}
                    </FieldLabel>
                    <input
                      id={`field-q-${qIndex}-question`}
                      placeholder={
                        q.type === 'likert'
                          ? 'e.g. Mobile money makes my life easier.'
                          : `Question ${qIndex + 1}`
                      }
                      className={fieldInputClass(!!questionError)}
                      value={q.question}
                      onChange={(e) => setQuestion(qIndex, { question: e.target.value })}
                    />
                    <FieldError message={questionError} />
                    <FieldHint>
                      {q.type === 'likert'
                        ? 'Write a statement members can agree or disagree with.'
                        : 'One clear question; avoid asking two things at once.'}
                    </FieldHint>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <select
                        aria-label={`Answer type for question ${qIndex + 1}`}
                        className={fieldInputClass(false)}
                        value={q.type}
                        onChange={(e) => changeType(qIndex, e.target.value as SurveyQuestionType)}
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {QUESTION_TYPE_INFO[t].label}
                          </option>
                        ))}
                      </select>
                      <FieldHint>{QUESTION_TYPE_INFO[q.type].help}</FieldHint>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 px-1 sm:px-4 py-2.5 text-sm text-[#0F172A] dark:text-white">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => setQuestion(qIndex, { required: e.target.checked })}
                        />
                        Required
                      </label>
                      <FieldHint className="px-1 sm:px-4 mt-0">
                        Members must answer it before submitting.
                      </FieldHint>
                    </div>
                  </div>

                  {needsOptions(q.type) && (
                    <div className="space-y-2">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            id={oIndex === 0 ? `field-q-${qIndex}-options` : undefined}
                            placeholder={`Option ${oIndex + 1}`}
                            aria-label={`Question ${qIndex + 1}, option ${oIndex + 1}`}
                            className={fieldInputClass(!!optionsError && !opt.trim())}
                            value={opt}
                            onChange={(e) => setOption(qIndex, oIndex, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            aria-label={`Remove option ${oIndex + 1}`}
                            className="p-2 text-[#EF4444]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <FieldError message={optionsError} />
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-xs font-semibold text-[#2563EB]"
                      >
                        + Add option
                      </button>
                      <FieldHint>
                        {q.type === 'multiple_choice'
                          ? 'At least 2 different options; members may tick several.'
                          : 'At least 2 different options; members pick one.'}
                      </FieldHint>
                    </div>
                  )}

                  {q.type === 'likert' && (
                    <div>
                      <div className="flex flex-wrap gap-1.5">
                        {LIKERT_OPTIONS.map((o) => (
                          <span
                            key={o}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#F8FAFC] dark:bg-[#334155] text-[#0F172A] dark:text-white border border-[#F1F5F9] dark:border-[#334155]"
                          >
                            <Lock size={10} className="text-[#94A3B8]" />
                            {o}
                          </span>
                        ))}
                      </div>
                      <FieldHint>Fixed answers, translated for members automatically.</FieldHint>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  aria-label={`Remove question ${qIndex + 1}`}
                  className="p-2 text-[#EF4444] flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && <FormBanner type="error" text={error} />}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
