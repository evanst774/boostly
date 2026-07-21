// src/modules/referrals/service.ts
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  referralCodes,
  referrals,
  type Referral,
  type ReferralCode,
} from '@/lib/db/schema/referrals';
import { RewardTypeEnum } from '@/lib/db/schema/rewards';
import { rewardsService } from '@/modules/rewards/service';
import {
  referralCodesRepository,
  referralsRepository,
} from '@/modules/referrals/repository';
import type { CreateReferralInput } from '@/modules/referrals/validation';

// ============================================
// COMMISSION POLICY
// ============================================

/**
 * Referrers earn a percentage of what their referee SPENDS.
 *
 * This replaced a flat 200/50 paid at signup. The percentage model is
 * structurally safer: payout is always a fraction of money that came in, so
 * there is no amount at which a referral pair extracts more than they paid.
 * The old flat bonus could be farmed with throwaway emails at zero cost.
 */
export const REFERRAL_COMMISSION_RATE = 0.18;

/**
 * WHAT COUNTS AS REVENUE — read this before adding a trigger type.
 *
 * Commission is paid on money Boostly KEEPS: badge purchases and subscription
 * payments. It is NOT paid on wallet deposits.
 *
 * A wallet deposit is a liability, not revenue — the user can withdraw it
 * again. Paying 18% on a deposit means handing out real money for a
 * transaction that earned nothing, and it is trivially farmable: deposit,
 * collect commission, withdraw. If someone asks you to "just add deposits
 * too", this is the reason not to.
 */
export const QualifyingPurchaseEnum = {
  BADGE_PURCHASE: 'BADGE_PURCHASE',
  SUBSCRIPTION_PAYMENT: 'SUBSCRIPTION_PAYMENT',
} as const;

export type QualifyingPurchaseType =
  (typeof QualifyingPurchaseEnum)[keyof typeof QualifyingPurchaseEnum];

/**
 * Whether renewals keep paying commission.
 *
 * false — commission on the referee's FIRST purchase only. Bounded liability:
 *   you know the maximum a referral can ever cost you.
 * true  — every renewal pays 18%, forever. Standard SaaS affiliate practice and
 *   a much stronger incentive to recruit, but the liability never closes and it
 *   compounds with churn-and-resubscribe gaming.
 *
 * Starting at false. Flip it once you have retention data and know what a
 * subscriber is actually worth over their lifetime.
 */
export const COMMISSION_ON_RENEWALS = false;

/**
 * Floor exists only to avoid dust rows, not as an anti-fraud measure — the
 * percentage model already removes the arbitrage a fixed bonus created.
 */
export const MIN_QUALIFYING_PURCHASE = 500;

/**
 * Commission is held before crediting, so a reversed mobile-money payment or a
 * refunded badge can be clawed back before the referrer withdraws it.
 * Set to 0 to credit immediately.
 */
export const COMMISSION_HOLD_DAYS = 7;

/** Referrals expire if the referee never buys anything. Closes your liability. */
export const REFERRAL_QUALIFY_WINDOW_DAYS = 90;

export const ReferralStatusEnum = {
  /** Referee signed up. Nothing paid. */
  PENDING: 'PENDING',
  /** Referee made a qualifying purchase. Commission paid. */
  ACTIVE: 'ACTIVE',
  /** Window closed with no purchase. Never pays. */
  EXPIRED: 'EXPIRED',
  /** Voided by an admin, or clawed back after a refund. */
  VOIDED: 'VOIDED',
} as const;

export type ReferralStatus =
  (typeof ReferralStatusEnum)[keyof typeof ReferralStatusEnum];

// ============================================
// TYPES
// ============================================

export interface PurchaseTrigger {
  type: QualifyingPurchaseType;
  /** Id of the badge purchase or subscription payment. Used for dedupe. */
  referenceId: string;
  /**
   * NET amount Boostly keeps, in the user's base currency, AFTER payment
   * processor fees. Commission on gross would quietly exceed 18% of margin.
   */
  netAmount: number;
  /** Human label for the reward description, e.g. "Gold Badge". */
  label: string;
}

export type QualifyResult =
  | {
      qualified: true;
      commission: number;
      rate: number;
      basis: number;
      isFirstPurchase: boolean;
    }
  | {
      qualified: false;
      reason:
        | 'NO_REFERRAL'
        | 'BELOW_MINIMUM'
        | 'RENEWALS_NOT_ELIGIBLE'
        | 'ALREADY_PAID_FOR_THIS_PURCHASE'
        | 'WINDOW_EXPIRED'
        | 'VOIDED';
    };

// ============================================
// SERVICE
// ============================================

export class ReferralsService {
  /**
   * Records the referral at signup WITHOUT paying anything.
   * Money only moves in recordPurchaseCommission().
   */
  async attachPendingReferral(
    refereeId: string,
    rawCode: string,
  ): Promise<{ attached: boolean; reason?: string }> {
    const code = rawCode.toUpperCase().trim();
    if (!code) return { attached: false, reason: 'EMPTY_CODE' };

    const referralCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, code),
    });

    if (!referralCode || !referralCode.isActive) {
      return { attached: false, reason: 'INVALID_CODE' };
    }
    if (referralCode.userId === refereeId) {
      return { attached: false, reason: 'SELF_REFERRAL' };
    }

    const existing = await db.query.referrals.findFirst({
      where: eq(referrals.refereeId, refereeId),
    });
    if (existing) {
      return { attached: false, reason: 'ALREADY_REFERRED' };
    }

    await db.insert(referrals).values({
      referrerId: referralCode.userId,
      refereeId,
      code,
      status: ReferralStatusEnum.PENDING,
      // Unknown until they buy something — commission is a percentage now.
      referrerReward: 0,
      refereeReward: 0,
      referrerRewardClaimed: false,
      refereeRewardClaimed: false,
      joinedAt: new Date().toISOString(),
      activatedAt: null,
    });

    await db
      .update(referralCodes)
      .set({
        timesUsed: sql`${referralCodes.timesUsed} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referralCodes.code, code));

    return { attached: true };
  }

  /**
   * Pays the referrer 18% of a referee's purchase.
   *
   * Call from badge purchase completion and subscription payment success.
   * NEVER from a wallet deposit or an earnings credit — see the comment on
   * QualifyingPurchaseEnum for why that would be self-destructive.
   *
   * Safe to call more than once for the same purchase: the dedupe key on
   * (userId, dedupeKey) makes a repeat a no-op rather than a second payout.
   */
  async recordPurchaseCommission(
    refereeId: string,
    trigger: PurchaseTrigger,
  ): Promise<QualifyResult> {
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.refereeId, refereeId),
    });

    if (!referral) return { qualified: false, reason: 'NO_REFERRAL' };
    if (referral.status === ReferralStatusEnum.VOIDED) {
      return { qualified: false, reason: 'VOIDED' };
    }
    if (trigger.netAmount < MIN_QUALIFYING_PURCHASE) {
      return { qualified: false, reason: 'BELOW_MINIMUM' };
    }

    const isFirstPurchase = referral.status === ReferralStatusEnum.PENDING;

    if (!isFirstPurchase && !COMMISSION_ON_RENEWALS) {
      return { qualified: false, reason: 'RENEWALS_NOT_ELIGIBLE' };
    }

    // The qualify window applies to the FIRST purchase only. Once a referral is
    // active, later renewals aren't time-limited.
    if (isFirstPurchase) {
      const joinedAt = new Date(referral.joinedAt ?? referral.createdAt);
      const closesAt =
        joinedAt.getTime() + REFERRAL_QUALIFY_WINDOW_DAYS * 86_400_000;

      if (Date.now() > closesAt) {
        await db
          .update(referrals)
          .set({
            status: ReferralStatusEnum.EXPIRED,
            updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
          })
          .where(eq(referrals.id, referral.id));
        return { qualified: false, reason: 'WINDOW_EXPIRED' };
      }
    }

    const commission = Math.round(trigger.netAmount * REFERRAL_COMMISSION_RATE);

    // Scope is the PURCHASE id, not the referral id — that's what allows
    // renewals to pay separately if you ever enable them, while still making a
    // duplicate webhook for the same purchase a no-op.
    const credit = await rewardsService.createReward({
      userId: referral.referrerId,
      type: RewardTypeEnum.REFERRAL,
      baseAmount: commission,
      description: `Referral commission — ${trigger.label}`,
      sourceId: referral.id,
      sourceType: 'referral',
      scope: `purchase:${trigger.referenceId}`,
      metadata: {
        referralId: referral.id,
        refereeId,
        purchaseType: trigger.type,
        purchaseReferenceId: trigger.referenceId,
        netAmount: trigger.netAmount,
        rate: REFERRAL_COMMISSION_RATE,
        isFirstPurchase,
      },
    });

    if (!credit.credited) {
      return { qualified: false, reason: 'ALREADY_PAID_FOR_THIS_PURCHASE' };
    }

    await db
      .update(referrals)
      .set({
        status: ReferralStatusEnum.ACTIVE,
        activatedAt: referral.activatedAt ?? new Date().toISOString(),
        // Running total across all this referee's purchases.
        referrerReward: sql`${referrals.referrerReward} + ${credit.amount}`,
        referrerRewardClaimed: true,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referrals.id, referral.id));

    return {
      qualified: true,
      commission: credit.amount,
      rate: REFERRAL_COMMISSION_RATE,
      basis: trigger.netAmount,
      isFirstPurchase,
    };
  }

  /**
   * What a referrer would earn from a given purchase. Use it in the UI so the
   * referrals page can show "earn 1,800 RWF when your invite buys Gold"
   * instead of an abstract percentage.
   */
  estimateCommission(netAmount: number): number {
    return Math.round(netAmount * REFERRAL_COMMISSION_RATE);
  }

  /** Admin action for fraud review. A voided referral never pays again. */
  async voidReferral(referralId: string): Promise<void> {
    await db
      .update(referrals)
      .set({
        status: ReferralStatusEnum.VOIDED,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referrals.id, referralId));
  }

  /** Cron. Closes windows that lapsed so outstanding liability stays readable. */
  async expireStaleReferrals(): Promise<number> {
    const cutoff = new Date(
      Date.now() - REFERRAL_QUALIFY_WINDOW_DAYS * 86_400_000,
    ).toISOString();

    const expired = await db
      .update(referrals)
      .set({
        status: ReferralStatusEnum.EXPIRED,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(
        and(
          eq(referrals.status, ReferralStatusEnum.PENDING),
          sql`${referrals.joinedAt} < ${cutoff}`,
        ),
      )
      .returning({ id: referrals.id });

    return expired.length;
  }

  // ============================================
  // ADMIN AGGREGATES
  // ============================================

  /**
   * Platform-wide referral health for the admin dashboard.
   *
   * The number that actually matters is `conversionRate`: what share of
   * referred signups ever bought anything. If it's near zero, the referral
   * programme is generating accounts that cost you money (they still earn from
   * videos and games) while producing no revenue — which means the incentive is
   * pointed at the wrong behaviour, not that referrers need a bigger cut.
   */
  async getGlobalStats(): Promise<{
    total: number;
    pending: number;
    active: number;
    expired: number;
    voided: number;
    totalCommissionPaid: number;
    averageCommission: number;
    conversionRate: number;
    commissionRate: number;
    topReferrers: Array<{
      referrerId: string;
      referralCount: number;
      totalEarned: number;
    }>;
  }> {
    const [byStatus, totals, top] = await Promise.all([
      db
        .select({
          status: referrals.status,
          count: sql<number>`count(*)`,
        })
        .from(referrals)
        .groupBy(referrals.status),

      db
        .select({
          commission: sql<number>`sum(${referrals.referrerReward})`,
          paidCount: sql<number>`count(*)`,
        })
        .from(referrals)
        .where(eq(referrals.status, ReferralStatusEnum.ACTIVE)),

      db
        .select({
          referrerId: referrals.referrerId,
          referralCount: sql<number>`count(*)`,
          totalEarned: sql<number>`sum(${referrals.referrerReward})`,
        })
        .from(referrals)
        .groupBy(referrals.referrerId)
        .orderBy(sql`sum(${referrals.referrerReward}) desc`)
        .limit(10),
    ]);

    const counts = byStatus.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = Number(row.count ?? 0);
      return acc;
    }, {});

    const pending = counts[ReferralStatusEnum.PENDING] ?? 0;
    const active = counts[ReferralStatusEnum.ACTIVE] ?? 0;
    const expired = counts[ReferralStatusEnum.EXPIRED] ?? 0;
    const voided = counts[ReferralStatusEnum.VOIDED] ?? 0;
    const total = pending + active + expired + voided;

    const totalCommissionPaid = Number(totals[0]?.commission ?? 0);

    return {
      total,
      pending,
      active,
      expired,
      voided,
      totalCommissionPaid,
      averageCommission: active > 0 ? totalCommissionPaid / active : 0,
      // Excludes still-open referrals: they haven't had their full window yet,
      // so counting them as failures would understate the real rate.
      conversionRate: active + expired > 0 ? active / (active + expired) : 0,
      commissionRate: REFERRAL_COMMISSION_RATE,
      topReferrers: top.map((r) => ({
        referrerId: r.referrerId,
        referralCount: Number(r.referralCount ?? 0),
        totalEarned: Number(r.totalEarned ?? 0),
      })),
    };
  }

  /** Paginated list for "my referrals" pages. */
  async getUserReferrals(
    userId: string,
    options: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ referrals: Referral[]; total: number }> {
    return referralsRepository.getByReferrerId(userId, options);
  }

  /** Fetches (or lazily creates) the user's shareable referral code. */
  async getMyReferralCode(userId: string): Promise<ReferralCode> {
    return referralCodesRepository.getOrCreate(userId);
  }

  /** Per-user counts, for the referrals page header. */
  async getMyReferralStats(userId: string) {
    return referralsRepository.getReferralStats(userId);
  }

  /** Attaches a referral code the current user was invited with. */
  async createReferral(
    refereeId: string,
    input: CreateReferralInput,
  ): Promise<{ attached: boolean; reason?: string }> {
    return this.attachPendingReferral(refereeId, input.code);
  }

  /**
   * Admin override for fraud review — normal activation happens automatically
   * inside recordPurchaseCommission() when a referee makes a qualifying purchase.
   */
  async activateReferral(referralId: string): Promise<Referral | undefined> {
    return referralsRepository.activateReferral(referralId);
  }

  /** Powers the referrals page. */
  async getReferralSummary(userId: string) {
    const rows = await db.query.referrals.findMany({
      where: eq(referrals.referrerId, userId),
    });

    const pending = rows.filter(
      (r) => r.status === ReferralStatusEnum.PENDING,
    ).length;
    const active = rows.filter(
      (r) => r.status === ReferralStatusEnum.ACTIVE,
    ).length;

    return {
      total: rows.length,
      /** Signed up, hasn't bought anything yet. Earns nothing so far. */
      pending,
      /** Bought at least once. */
      active,
      totalEarned: rows.reduce((sum, r) => sum + (r.referrerReward ?? 0), 0),
      commissionRate: REFERRAL_COMMISSION_RATE,
      commissionOnRenewals: COMMISSION_ON_RENEWALS,
    };
  }
}

export const referralsService = new ReferralsService();
