// src/lib/constants/payouts.ts
//
// Single source of truth for how users get paid. Client-safe (no DB imports)
// so the landing page, dashboard, withdraw flow and API all agree.

/** Rwanda is UTC+2 all year (no DST), so a fixed offset is exact. */
export const PAYOUT_TIMEZONE = 'Africa/Kigali';
const KIGALI_UTC_OFFSET_HOURS = 2;

/** All withdrawal requests are paid out once a day at this local hour. */
export const PAYOUT_HOUR = 15; // 3:00 PM Kigali time
export const PAYOUT_TIME_LABEL = '3:00 PM';

export const MIN_WITHDRAWAL = 1000;
export const WITHDRAWAL_CURRENCY = 'RWF';

/**
 * How often a user may request a withdrawal, by plan.
 * Free users earn a little every day and cash out weekly;
 * any paid plan can cash out every day.
 */
export const FREE_WITHDRAWAL_INTERVAL_DAYS = 7;
export const PAID_WITHDRAWAL_INTERVAL_DAYS = 1;

export function getWithdrawalIntervalDays(tier: string | null | undefined) {
  return !tier || tier === 'FREE'
    ? FREE_WITHDRAWAL_INTERVAL_DAYS
    : PAID_WITHDRAWAL_INTERVAL_DAYS;
}

export function describeWithdrawalFrequency(tier: string | null | undefined) {
  return getWithdrawalIntervalDays(tier) === 1 ? 'Every day' : 'Once a week';
}

// ─── Time helpers ──────────────────────────────────────────────────

const HOUR = 60 * 60 * 1000;

/** YYYY-MM-DD of the given instant in Kigali. */
export function kigaliDateKey(at: Date = new Date()): string {
  return new Date(at.getTime() + KIGALI_UTC_OFFSET_HOURS * HOUR)
    .toISOString()
    .slice(0, 10);
}

/** UTC ISO instant of today's 00:00 in Kigali. Daily task quotas reset here. */
export function kigaliDayStartIso(at: Date = new Date()): string {
  const midnightUtc =
    Date.parse(`${kigaliDateKey(at)}T00:00:00.000Z`) -
    KIGALI_UTC_OFFSET_HOURS * HOUR;
  return new Date(midnightUtc).toISOString();
}

/**
 * The next 3:00 PM Kigali payout run. A request made before 3:00 PM is paid
 * the same day; after that, it joins tomorrow's run.
 */
export function getNextPayoutAt(now: Date = new Date()): Date {
  const payoutUtcHour = PAYOUT_HOUR - KIGALI_UTC_OFFSET_HOURS;
  const today = kigaliDateKey(now);
  const candidate = new Date(
    `${today}T${String(payoutUtcHour).padStart(2, '0')}:00:00.000Z`,
  );
  if (candidate.getTime() > now.getTime()) return candidate;
  return new Date(candidate.getTime() + 24 * HOUR);
}

/** "Today at 3:00 PM" / "Tomorrow at 3:00 PM" / "Mon 24 Nov at 3:00 PM". */
export function formatPayoutDay(payoutAt: Date, now: Date = new Date()) {
  const dayDiff = Math.round(
    (Date.parse(kigaliDateKey(payoutAt)) - Date.parse(kigaliDateKey(now))) /
      (24 * HOUR),
  );
  if (dayDiff === 0) return `Today at ${PAYOUT_TIME_LABEL}`;
  if (dayDiff === 1) return `Tomorrow at ${PAYOUT_TIME_LABEL}`;
  const label = payoutAt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: PAYOUT_TIMEZONE,
  });
  return `${label} at ${PAYOUT_TIME_LABEL}`;
}

/** "2h 14m" style countdown. */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now';
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Mobile money ──────────────────────────────────────────────────

export type MobileMoneyProvider = 'MTN' | 'AIRTEL';

export const MOBILE_MONEY_PROVIDERS: Record<
  MobileMoneyProvider,
  { label: string; prefixes: string[] }
> = {
  MTN: { label: 'MTN MoMo', prefixes: ['78', '79'] },
  AIRTEL: { label: 'Airtel Money', prefixes: ['72', '73'] },
};

/**
 * Accepts 07XXXXXXXX, 7XXXXXXXX, 2507XXXXXXXX or +2507XXXXXXXX (spaces and
 * dashes allowed) and returns the canonical 2507XXXXXXXX, or null.
 */
export function normalizeRwandaPhone(input: string): string | null {
  const digits = (input || '').replace(/[^\d]/g, '');
  let local: string;
  if (digits.startsWith('250') && digits.length === 12) local = digits.slice(3);
  else if (digits.startsWith('0') && digits.length === 10)
    local = digits.slice(1);
  else if (digits.length === 9) local = digits;
  else return null;
  if (!/^7[2389]\d{7}$/.test(local)) return null;
  return `250${local}`;
}

export function detectMobileProvider(
  phone: string,
): MobileMoneyProvider | null {
  const normalized = normalizeRwandaPhone(phone);
  if (!normalized) return null;
  const prefix = normalized.slice(3, 5);
  for (const [id, p] of Object.entries(MOBILE_MONEY_PROVIDERS)) {
    if (p.prefixes.includes(prefix)) return id as MobileMoneyProvider;
  }
  return null;
}

/** 250781234567 -> "078 123 4567" */
export function formatRwandaPhone(phone: string | null | undefined): string {
  const normalized = phone ? normalizeRwandaPhone(phone) : null;
  if (!normalized) return phone || '';
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
