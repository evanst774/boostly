// src/modules/badges/plan-quote.ts
//
// What a member pays to start, renew or upgrade a plan. Used by BOTH payment
// methods (wallet balance and mobile money) so they always charge the same:
//   - no plan yet ............ full price
//   - same plan (renewal) .... full price, added after the current period
//   - higher plan (upgrade) .. price minus credit for the unused days left
//   - lower plan ............. not allowed until the current plan ends
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptionPlans, userSubscriptions, type SubscriptionPlan } from '@/lib/db/schema';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface PlanQuote {
  kind: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE_BLOCKED';
  /** List price of the chosen plan for this cycle. */
  price: number;
  /** Value of the unused days of the current plan (upgrades only). */
  credit: number;
  /** What the member pays now. */
  due: number;
  currentPlan: { id: string; name: string; expiresAt: string | null } | null;
  /** Why the purchase isn't allowed (DOWNGRADE_BLOCKED). */
  message: string | null;
}

export const planPrice = (plan: Pick<SubscriptionPlan, 'priceMonthly' | 'priceYearly'>, cycle: BillingCycle) =>
  cycle === 'YEARLY' ? plan.priceYearly ?? plan.priceMonthly * 10 : plan.priceMonthly;

export async function quotePlan(userId: string, plan: SubscriptionPlan, cycle: BillingCycle): Promise<PlanQuote> {
  const price = Math.round(planPrice(plan, cycle));
  const now = Date.now();

  const sub = await db.query.userSubscriptions.findFirst({ where: eq(userSubscriptions.userId, userId) });
  const active =
    sub && sub.status === 'ACTIVE' && (!sub.expiresAt || new Date(sub.expiresAt).getTime() > now) ? sub : null;
  if (!active) return { kind: 'NEW', price, credit: 0, due: price, currentPlan: null, message: null };

  const current = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, active.planId) });
  const currentPlan = current ? { id: current.id, name: current.name, expiresAt: active.expiresAt } : null;

  if (!current || current.id === plan.id) {
    return { kind: 'RENEWAL', price, credit: 0, due: price, currentPlan, message: null };
  }

  if (plan.priceMonthly <= current.priceMonthly) {
    const until = active.expiresAt ? new Date(active.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'it ends';
    return {
      kind: 'DOWNGRADE_BLOCKED',
      price,
      credit: 0,
      due: price,
      currentPlan,
      message: `You're on ${current.name}. You can switch to a lower plan after it ends (${until}).`,
    };
  }

  // Upgrade: credit the unused share of what the current period cost.
  const start = new Date(active.startsAt).getTime();
  const end = active.expiresAt ? new Date(active.expiresAt).getTime() : now;
  const total = Math.max(1, end - start);
  const left = Math.max(0, Math.min(total, end - now));
  const paidForPeriod = planPrice(current, (active.billingCycle as BillingCycle) || 'MONTHLY');
  const credit = Math.min(price, Math.floor((paidForPeriod * left) / total));
  return { kind: 'UPGRADE', price, credit, due: Math.max(0, price - credit), currentPlan, message: null };
}
