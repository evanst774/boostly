// src/modules/wallet/withdrawal-policy.ts
//
// Who may request a withdrawal, and when. Each plan sets its own interval in
// Admin (defaults: Free weekly, paid daily). Every request is paid at the next 3:00 PM run.
import { db } from '@/lib/db';
import { withdrawals, wallets, WithdrawalStatusEnum } from '@/lib/db/schema';
import { and, desc, eq, ne } from 'drizzle-orm';
import { getUserPlan } from '@/modules/rewards/plan-limits';
import {
  MIN_WITHDRAWAL,
  describeIntervalDays,
  getNextPayoutAt,
  kigaliDateKey,
} from '@/lib/constants/payouts';

const DAY = 24 * 60 * 60 * 1000;

export interface WithdrawalEligibility {
  canWithdraw: boolean;
  /** Why the user can't withdraw right now (null when they can). */
  reason: string | null;
  /** Machine-readable reason, so screens can show it in the member's language. */
  reasonCode: 'ALREADY_TODAY' | 'INTERVAL' | 'MIN_BALANCE' | null;
  balance: number;
  pendingAmount: number;
  minAmount: number;
  plan: { tier: string; name: string; isFree: boolean };
  intervalDays: number;
  frequencyLabel: string;
  /** When the next request is allowed (ISO). Equals now when allowed. */
  nextAllowedAt: string;
  /** When a request made now would be paid (ISO). */
  nextPayoutAt: string;
  /** Phone used on the last request, to prefill the form. */
  lastPhoneNumber: string | null;
  lastAccountName: string | null;
}

/** Midnight (start) of the next Kigali calendar day, as a UTC instant. */
function startOfNextKigaliDay(now: Date): Date {
  const kigaliMidnightUtc = Date.parse(`${kigaliDateKey(now)}T00:00:00.000Z`) -
    2 * 60 * 60 * 1000;
  return new Date(kigaliMidnightUtc + DAY);
}

export async function getWithdrawalEligibility(
  userId: string,
  now: Date = new Date(),
): Promise<WithdrawalEligibility> {
  const [plan, wallet, last] = await Promise.all([
    getUserPlan(userId),
    db.query.wallets.findFirst({ where: eq(wallets.userId, userId) }),
    // Rejected (FAILED) requests don't count against the user's allowance.
    db.query.withdrawals.findFirst({
      where: and(
        eq(withdrawals.userId, userId),
        ne(withdrawals.status, WithdrawalStatusEnum.FAILED),
      ),
      orderBy: [desc(withdrawals.requestedAt)],
    }),
  ]);

  const balance = wallet?.balance ?? 0;
  const intervalDays = plan.withdrawalIntervalDays; // set per plan in Admin

  let nextAllowedAt = now;
  if (last) {
    const lastAt = new Date(last.requestedAt);
    if (intervalDays === 1) {
      // One request per Kigali calendar day.
      if (kigaliDateKey(lastAt) === kigaliDateKey(now)) {
        nextAllowedAt = startOfNextKigaliDay(now);
      }
    } else {
      const allowedAt = new Date(lastAt.getTime() + intervalDays * DAY);
      if (allowedAt > now) nextAllowedAt = allowedAt;
    }
  }

  let reason: string | null = null;
  let reasonCode: WithdrawalEligibility['reasonCode'] = null;
  if (nextAllowedAt > now) {
    reasonCode = intervalDays <= 1 ? 'ALREADY_TODAY' : 'INTERVAL';
    const freq = describeIntervalDays(intervalDays).toLowerCase();
    reason =
      intervalDays <= 1
        ? 'You have already requested a withdrawal today. You can request again tomorrow.'
        : `Your ${plan.name.replace(/ Plan$/, '')} plan can withdraw ${freq}. Upgrade to withdraw more often.`;
  } else if (balance < MIN_WITHDRAWAL) {
    reasonCode = 'MIN_BALANCE';
    reason = `You need at least ${MIN_WITHDRAWAL.toLocaleString()} RWF to withdraw. Keep completing tasks!`;
  }

  return {
    canWithdraw: reason === null,
    reasonCode,
    reason,
    balance,
    pendingAmount: wallet?.pendingWithdrawal ?? 0,
    minAmount: MIN_WITHDRAWAL,
    plan: { tier: plan.tier, name: plan.name, isFree: plan.isFree },
    intervalDays,
    frequencyLabel: describeIntervalDays(intervalDays),
    nextAllowedAt: nextAllowedAt.toISOString(),
    nextPayoutAt: getNextPayoutAt(now).toISOString(),
    lastPhoneNumber: last?.phoneNumber ?? null,
    lastAccountName: last?.accountName ?? null,
  };
}
