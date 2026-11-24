// src/components/admin/content/FieldHelp.tsx
//
// Small building blocks shared by the admin content forms (videos, games,
// surveys): labels with a required marker and an optional "?" detail panel,
// muted helper lines, inline field errors, callouts, the result banner, and
// helpers that turn server errors ("field: message") into plain sentences.
'use client';

import { useId, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// STYLES
// ============================================

export const inputBaseClass =
  'w-full px-4 py-2.5 border rounded-xl focus:ring-2 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white';

/** Input classes, switching to a red border when the field has an error. */
export function fieldInputClass(hasError?: boolean, extra?: string) {
  return cn(
    inputBaseClass,
    hasError
      ? 'border-[#EF4444] dark:border-[#F87171] focus:border-[#EF4444] focus:ring-[#EF4444]/20'
      : 'border-[#F1F5F9] dark:border-[#334155] focus:border-[#2563EB] focus:ring-[#2563EB]/20',
    extra,
  );
}

const hintClass = 'mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]';

// ============================================
// LABEL / HINT / ERROR
// ============================================

interface FieldLabelProps {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  /** Longer explanation, shown when the "?" button is pressed. */
  tip?: ReactNode;
  className?: string;
}

/** Field label with a "*" for required fields and an optional "?" detail panel. */
export function FieldLabel({
  htmlFor,
  children,
  required,
  tip,
  className,
}: FieldLabelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className={cn('mb-1.5', className)}>
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-[#0F172A] dark:text-white"
        >
          {children}
          {required && (
            <span className="text-[#EF4444] ml-0.5" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        {tip && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label="More about this field"
            title="More about this field"
            className={cn(
              'rounded-full p-0.5 transition-colors',
              open
                ? 'text-[#2563EB] dark:text-[#60A5FA]'
                : 'text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#60A5FA]',
            )}
          >
            <HelpCircle size={14} />
          </button>
        )}
      </div>
      {tip && open && (
        <div
          id={panelId}
          className="mt-1.5 p-2.5 rounded-lg flex gap-2 text-xs leading-relaxed bg-[#EFF6FF] dark:bg-[#2563EB]/10 text-[#1E3A8A] dark:text-[#BFDBFE] border border-[#DBEAFE] dark:border-[#2563EB]/20"
        >
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-1">{tip}</div>
        </div>
      )}
    </div>
  );
}

/** Short muted helper line under a field. */
export function FieldHint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn(hintClass, className)}>{children}</p>;
}

/** Inline error under a field (renders nothing without a message). */
export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-xs font-medium text-[#EF4444] dark:text-[#F87171] flex items-start gap-1"
    >
      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </p>
  );
}

// ============================================
// CALLOUTS / BANNER
// ============================================

const CALLOUT_STYLES = {
  info: {
    icon: Info,
    className:
      'bg-[#EFF6FF] dark:bg-[#2563EB]/10 text-[#1E3A8A] dark:text-[#BFDBFE] border-[#DBEAFE] dark:border-[#2563EB]/20',
  },
  tip: {
    icon: Lightbulb,
    className:
      'bg-[#F0FDF4] dark:bg-[#22C55E]/10 text-[#166534] dark:text-[#BBF7D0] border-[#BBF7D0] dark:border-[#22C55E]/20',
  },
  warning: {
    icon: AlertTriangle,
    className:
      'bg-[#FFFBEB] dark:bg-[#F59E0B]/10 text-[#92400E] dark:text-[#FDE68A] border-[#FDE68A] dark:border-[#F59E0B]/20',
  },
} as const;

/** Small boxed note: info, tip or warning. */
export function Callout({
  tone = 'info',
  children,
  className,
}: {
  tone?: keyof typeof CALLOUT_STYLES;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass } = CALLOUT_STYLES[tone];
  return (
    <div
      className={cn(
        'p-2.5 rounded-lg flex gap-2 text-xs leading-relaxed border',
        toneClass,
        className,
      )}
    >
      <Icon size={14} className="flex-shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0">{children}</div>
    </div>
  );
}

/** Success / error banner shown above the submit button. */
export function FormBanner({
  type,
  text,
}: {
  type: 'success' | 'error';
  text: string;
}) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'p-3 rounded-xl flex items-start gap-2 text-sm',
        type === 'success'
          ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
          : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
      )}
    >
      {type === 'success' ? (
        <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      )}
      <span>{text}</span>
    </div>
  );
}

// ============================================
// ERROR HELPERS
// ============================================

export type FieldErrors = Record<string, string | undefined>;

/** Rewrites generic validation wording into something an admin can act on. */
export function humanizeIssue(message: string, labels: Record<string, string> = {}) {
  let text = message.trim();
  const rules: Array<[RegExp, string]> = [
    [/^Too small: expected string to have >=1 characters?$/i, 'This field is required'],
    [/^Too big: expected string to have <=(\d+) characters?$/i, 'Keep it to $1 characters or fewer'],
    [/^Too small: expected number to be >0$/i, 'Enter a number greater than 0'],
    [/^Too small: expected number to be >=(\d+)$/i, 'Enter $1 or more'],
    [/^Too big: expected number to be <=(\d+)$/i, 'Enter $1 or less'],
    [/^Invalid input: expected number, received NaN$/i, 'Enter a number'],
    [/^Invalid input: expected (string|number|boolean), received (undefined|null)$/i, 'This field is required'],
    [/^Invalid input: expected int, received number$/i, 'Enter a whole number'],
    [/^Invalid option: expected one of .*$/i, 'Pick one of the listed options'],
    [/^Invalid ISO datetime$/i, 'Enter a valid date and time'],
  ];
  for (const [re, out] of rules) {
    if (re.test(text)) {
      text = text.replace(re, out);
      break;
    }
  }
  // Replace raw field keys ("maxReward") with their labels ("Max reward").
  for (const [key, label] of Object.entries(labels)) {
    text = text.replace(new RegExp(`\\b${key}\\b`, 'g'), label.toLowerCase());
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Turns a server error into `{ field, text }`. Understands "field: message"
 * (from the content API) and, defensively, raw validation JSON — so the
 * banner never shows JSON. `labels` maps field keys to their form labels.
 */
export function parseServerError(
  raw: string,
  labels: Record<string, string>,
): { field?: string; text: string; banner: string } {
  let message = (raw || '').trim();

  // Raw validation JSON ([{ path: [...], message }] or { issues: [...] }).
  if (message.startsWith('[') || message.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(message);
      const list = Array.isArray(parsed)
        ? parsed
        : (parsed as { issues?: unknown[]; error?: unknown }).issues ??
          [(parsed as { error?: unknown }).error ?? parsed];
      const first = list[0] as
        | { path?: Array<string | number>; message?: string }
        | string
        | undefined;
      if (typeof first === 'string') {
        message = first;
      } else if (first && typeof first === 'object') {
        const path = Array.isArray(first.path) ? first.path.join('.') : '';
        message = path
          ? `${path}: ${first.message ?? 'Invalid value'}`
          : first.message ?? 'Please check the form.';
      } else {
        message = 'Please check the form.';
      }
    } catch {
      message = 'The server could not read the form. Please check the fields and try again.';
    }
  }

  const match = /^([A-Za-z][\w.]*):\s+([\s\S]+)$/.exec(message);
  if (match && (match[1] in labels || match[1].split('.')[0] in labels)) {
    const key = match[1] in labels ? match[1] : match[1].split('.')[0];
    const text = humanizeIssue(match[2], labels);
    return { field: key, text, banner: `${labels[key]}: ${text}` };
  }
  const text = humanizeIssue(message || 'Something went wrong. Please try again.', labels);
  return { text, banner: text };
}

/** Moves focus to the first field with an error (by element id). */
export function focusFirstError(errors: FieldErrors, order: string[]) {
  const first = order.find((k) => errors[k]);
  if (!first || typeof document === 'undefined') return;
  const el = document.getElementById(`field-${first}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLElement).focus?.({ preventScroll: true });
  }
}

// ============================================
// URL HELPERS (mirror the server: blank = none, https:// added)
// ============================================

/** Same rule as the server: trim and add https:// to bare domains. */
export function normalizeUrl(value: string): string {
  const t = value.trim();
  if (!t) return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`;
}

/** Whether the server would accept this as a link. */
export function isValidUrl(value: string): boolean {
  const t = normalizeUrl(value);
  if (!t || /\s/.test(t)) return false;
  try {
    const u = new URL(t);
    return u.hostname.includes('.') || u.hostname === 'localhost';
  } catch {
    return false;
  }
}

/** True when text looks like a link (used to keep URLs out of Tags). */
export function looksLikeUrl(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  if (/^(https?:\/\/|www\.)/i.test(t)) return true;
  // Bare domains with a path (youtu.be/abc, example.com/page) ...
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*$/i.test(t)) return true;
  // ... or a plain domain with a common ending (mtn.co.rw) — but not "node.js".
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|net|org|io|rw|be|co|tv|app|buzz|info|me|ly|gl)$/i.test(t);
}

/** Formats seconds as m:ss (or h:mm:ss). */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/**
 * Average reward multiplier assumed for budget estimates (plan and badge
 * boosts raise what members actually receive above the base reward).
 */
export const AVERAGE_BOOST_ESTIMATE = 1.5;

/** Estimated number of paid completions a budget covers, or null. */
export function estimatePaidCompletions(
  budget: number | null | undefined,
  reward: number,
): number | null {
  if (!budget || budget <= 0 || !reward || reward <= 0) return null;
  return Math.floor(budget / (reward * AVERAGE_BOOST_ESTIMATE));
}
