// src/modules/rewards/service.ts
import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  rewards,
  RewardStatusEnum,
  RewardTypeEnum,
  type Reward,
  type RewardType,
  type AdWatch,
  type DailyBonus,
} from '@/lib/db/schema/rewards';
import {
  transactions,
  wallets,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@/lib/db/schema/wallet';
import { walletRepository } from '@/modules/wallet/repository';
import {
  adWatchesRepository,
  dailyBonusesRepository,
} from '@/modules/rewards/repository';
import type { CreateAdWatchInput } from '@/modules/rewards/validation';
import {
  userBadgesRepository,
  userSubscriptionsRepository,
} from '@/modules/badges/repository';
import { getUserDailyLimits } from '@/modules/rewards/plan-limits';

// ============================================
// TYPES
// ============================================

export interface CreateRewardInput {
  userId: string;
  type: RewardType;
  /** Pre-multiplier value. Badge/subscription boosts are applied here, not by callers. */
  baseAmount: number;
  description: string;
  sourceId: string;
  sourceType: string;
  /**
   * Idempotency scope. Combined with type + sourceId into the dedupe key.
   *   'once'          one-time content
   *   'YYYY-MM-DD'    daily-repeatable content
   *   <sessionId>     one payout per game session
   */
  scope: string;
  metadata?: Record<string, unknown>;
}

export type CreateRewardResult =
  | {
      credited: true;
      reward: Reward;
      amount: number;
      baseAmount: number;
      multiplier: number;
      newBalance: number;
    }
  | {
      credited: false;
      reason: 'ALREADY_CREDITED' | 'ZERO_AMOUNT';
      amount: 0;
    };

export interface EarningsMultiplier {
  badgeBoost: number;
  planBoost: number;
  total: number;
}

// ============================================
// CONSTANTS
// ============================================

/** RWF has no minor unit and users read round numbers as trustworthy. */
const ROUNDING_STEP = 5;

function roundReward(amount: number): number {
  return Math.round(amount / ROUNDING_STEP) * ROUNDING_STEP;
}

// ============================================
// SERVICE
// ============================================

export class RewardsService {
  /**
   * Creates a reward AND credits the user's wallet as one atomic unit.
   *
   * This is the ONLY place money enters a wallet from earning activity. Videos,
   * games, surveys, daily bonuses and referrals all funnel through here so that
   * the ledger, the balance and the transaction history can never disagree.
   *
   * Idempotent by construction: the unique index on (userId, dedupeKey) makes a
   * repeat call for the same logical event a no-op rather than a double payout.
   * A double-tapped "Claim" button, a retried request, or a client that fires
   * complete() twice all resolve to a single credit.
   */
  async createReward(input: CreateRewardInput): Promise<CreateRewardResult> {
    if (input.baseAmount <= 0) {
      return { credited: false, reason: 'ZERO_AMOUNT', amount: 0 };
    }

    const dedupeKey = `${input.type}:${input.sourceId}:${input.scope}`;

    // Resolve the multiplier and ensure the wallet row exists BEFORE opening the
    // transaction. Interactive transactions hold a write lock on SQLite/libSQL,
    // so anything that can be done outside should be.
    const multiplier = await this.getEarningsMultiplier(input.userId);
    const amount = roundReward(input.baseAmount * multiplier.total);

    if (amount <= 0) {
      return { credited: false, reason: 'ZERO_AMOUNT', amount: 0 };
    }

    const wallet = await walletRepository.getOrCreate(input.userId);
    const now = new Date().toISOString();

    try {
      return await db.transaction(async (tx) => {
        const [reward] = await tx
          .insert(rewards)
          .values({
            userId: input.userId,
            type: input.type,
            amount,
            baseAmount: input.baseAmount,
            multiplier: multiplier.total,
            description: input.description,
            sourceId: input.sourceId,
            sourceType: input.sourceType,
            dedupeKey,
            status: RewardStatusEnum.CLAIMED,
            claimedAt: now,
            metadata: {
              ...input.metadata,
              badgeBoost: multiplier.badgeBoost,
              planBoost: multiplier.planBoost,
            },
          })
          .returning();

        // Ledger entry. unified-wallet.service reads THIS for earnings stats,
        // which is why a reward row alone was never enough.
        await tx.insert(transactions).values({
          walletId: wallet.id,
          userId: input.userId,
          type: TransactionTypeEnum.CREDIT,
          amount,
          currency: wallet.defaultCurrency,
          amountInBase: amount,
          description: input.description,
          referenceId: reward.id,
          referenceType: 'reward',
          status: TransactionStatusEnum.COMPLETED,
          completedAt: now,
        });

        // Relative update, never read-modify-write, so concurrent credits from
        // two tabs can't clobber each other.
        const [updatedWallet] = await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${amount}`,
            totalEarned: sql`${wallets.totalEarned} + ${amount}`,
            lastActivityAt: now,
            updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
          })
          .where(eq(wallets.id, wallet.id))
          .returning();

        return {
          credited: true as const,
          reward,
          amount,
          baseAmount: input.baseAmount,
          multiplier: multiplier.total,
          newBalance: updatedWallet.balance,
        };
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Already paid for this exact event. Expected, not exceptional.
        return { credited: false, reason: 'ALREADY_CREDITED', amount: 0 };
      }
      throw err;
    }
  }

  /**
   * Badge boost + subscription boost, combined additively onto a base of 1.
   *
   * Badge tiers do NOT stack with each other — a user holding Silver and Gold
   * gets Gold's 30%, not 45%. Plan boost is separate and does stack with badge.
   */
  async getEarningsMultiplier(userId: string): Promise<EarningsMultiplier> {
    const [badgeBoost, planBoost] = await Promise.all([
      this.getBadgeBoost(userId),
      this.getSubscriptionBoost(userId),
    ]);

    return {
      badgeBoost,
      planBoost,
      total: 1 + badgeBoost + planBoost,
    };
  }

  /** The user's active badge's earnings boost (e.g. Gold -> 0.30). 0 if none. */
  private async getBadgeBoost(userId: string): Promise<number> {
    const activeBadge = await userBadgesRepository.getActiveByUserId(userId);
    return activeBadge?.badge?.earningsBoost ?? 0;
  }

  /** The user's active (non-expired) subscription plan's boost. 0 if none. */
  private async getSubscriptionBoost(userId: string): Promise<number> {
    const activeSubscription =
      await userSubscriptionsRepository.getActiveByUserId(userId);
    return activeSubscription?.plan?.badgeBoost ?? 0;
  }

  // ============================================
  // READS
  // ============================================

  async getUserRewards(
    userId: string,
    options: { limit?: number; offset?: number; type?: RewardType } = {},
  ): Promise<{ rewards: Reward[]; total: number }> {
    const conditions = [eq(rewards.userId, userId)];
    if (options.type) conditions.push(eq(rewards.type, options.type));
    const where = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.rewards.findMany({
        where,
        limit: options.limit ?? 50,
        offset: options.offset ?? 0,
        orderBy: [desc(rewards.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(rewards)
        .where(where),
    ]);

    return { rewards: items, total: Number(totalResult[0]?.count ?? 0) };
  }

  /** Total credited today, in the wallet's currency. */
  async getTodayEarnings(userId: string): Promise<number> {
    const startOfDay = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;

    const result = await db
      .select({ sum: sql<number>`sum(${rewards.amount})` })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          gte(rewards.createdAt, startOfDay),
        ),
      );

    return Number(result[0]?.sum ?? 0);
  }

  /** How many rewards of a given type the user has earned today. Backs per-plan daily quotas. */
  async getTodayRewardCount(userId: string, type: RewardType): Promise<number> {
    const startOfDay = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.type, type),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          gte(rewards.createdAt, startOfDay),
        ),
      );

    return Number(result[0]?.count ?? 0);
  }

  // ============================================
  // ADMIN AGGREGATES
  // ============================================

  /**
   * Platform-wide payout figures for the admin dashboard.
   *
   * This is your cost of doing business in one object — every number here is
   * money that left the company. Watch `today` against whatever your daily
   * revenue is; if it exceeds it, the reward configuration is upside down.
   *
   * NOTE: these are full-table aggregates with no date bound on the totals.
   * Fine at current volume; once `rewards` passes a few hundred thousand rows,
   * cache this or maintain a rollup table rather than scanning on every load.
   */
  async getStats(): Promise<{
    totalPaid: number;
    totalCount: number;
    todayPaid: number;
    todayCount: number;
    monthPaid: number;
    averageReward: number;
    byType: Array<{ type: RewardType; total: number; count: number }>;
  }> {
    const startOfToday = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
    const startOfMonth = `${new Date().toISOString().slice(0, 7)}-01T00:00:00.000Z`;

    const claimed = eq(rewards.status, RewardStatusEnum.CLAIMED);

    const [allTime, today, month, byType] = await Promise.all([
      db
        .select({
          total: sql<number>`sum(${rewards.amount})`,
          count: sql<number>`count(*)`,
        })
        .from(rewards)
        .where(claimed),

      db
        .select({
          total: sql<number>`sum(${rewards.amount})`,
          count: sql<number>`count(*)`,
        })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfToday))),

      db
        .select({ total: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfMonth))),

      db
        .select({
          type: rewards.type,
          total: sql<number>`sum(${rewards.amount})`,
          count: sql<number>`count(*)`,
        })
        .from(rewards)
        .where(claimed)
        .groupBy(rewards.type),
    ]);

    const totalPaid = Number(allTime[0]?.total ?? 0);
    const totalCount = Number(allTime[0]?.count ?? 0);

    return {
      totalPaid,
      totalCount,
      todayPaid: Number(today[0]?.total ?? 0),
      todayCount: Number(today[0]?.count ?? 0),
      monthPaid: Number(month[0]?.total ?? 0),
      averageReward: totalCount > 0 ? totalPaid / totalCount : 0,
      byType: byType.map((r) => ({
        type: r.type,
        total: Number(r.total ?? 0),
        count: Number(r.count ?? 0),
      })),
    };
  }

  /** Today/week/month/all-time totals for the user's own dashboard. */
  async getUserEarningsStats(userId: string): Promise<{
    today: number;
    week: number;
    month: number;
    total: number;
  }> {
    const startOfDay = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
    const startOfWeek = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const startOfMonth = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const claimed = and(
      eq(rewards.userId, userId),
      eq(rewards.status, RewardStatusEnum.CLAIMED),
    );

    const [today, week, month, total] = await Promise.all([
      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfDay))),
      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfWeek))),
      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfMonth))),
      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(claimed),
    ]);

    return {
      today: Number(today[0]?.sum ?? 0),
      week: Number(week[0]?.sum ?? 0),
      month: Number(month[0]?.sum ?? 0),
      total: Number(total[0]?.sum ?? 0),
    };
  }

  /**
   * Claims a single PENDING reward: flips it to CLAIMED and credits the wallet
   * in one transaction, mirroring createReward's ledger/balance/history contract.
   *
   * In the current flow every reward is created already CLAIMED (see
   * createReward above), so PENDING rewards are rare in practice — but this
   * stays correct for any reward that IS created pending (e.g. a manual admin
   * grant). Claiming an already-claimed reward is a safe no-op, not an error.
   */
  async claimReward(
    userId: string,
    rewardId: string,
  ): Promise<{ reward: Reward; amount: number; newBalance: number }> {
    const existing = await db.query.rewards.findFirst({
      where: eq(rewards.id, rewardId),
    });
    if (!existing || existing.userId !== userId) {
      throw new Error('Reward not found');
    }

    const wallet = await walletRepository.getOrCreate(userId);

    if (existing.status !== RewardStatusEnum.PENDING) {
      return { reward: existing, amount: 0, newBalance: wallet.balance };
    }

    const now = new Date().toISOString();

    return await db.transaction(async (tx) => {
      const [reward] = await tx
        .update(rewards)
        .set({
          status: RewardStatusEnum.CLAIMED,
          claimedAt: now,
          updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        })
        .where(eq(rewards.id, rewardId))
        .returning();

      await tx.insert(transactions).values({
        walletId: wallet.id,
        userId,
        type: TransactionTypeEnum.CREDIT,
        amount: reward.amount,
        currency: wallet.defaultCurrency,
        amountInBase: reward.amount,
        description: reward.description ?? 'Reward claimed',
        referenceId: reward.id,
        referenceType: 'reward',
        status: TransactionStatusEnum.COMPLETED,
        completedAt: now,
      });

      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${reward.amount}`,
          totalEarned: sql`${wallets.totalEarned} + ${reward.amount}`,
          lastActivityAt: now,
          updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        })
        .where(eq(wallets.id, wallet.id))
        .returning();

      return { reward, amount: reward.amount, newBalance: updatedWallet.balance };
    });
  }

  /** Claims every PENDING reward the user has, in one transaction. */
  async claimAllRewards(userId: string): Promise<{
    claimedCount: number;
    totalAmount: number;
    newBalance: number;
  }> {
    const wallet = await walletRepository.getOrCreate(userId);

    const pending = await db.query.rewards.findMany({
      where: and(
        eq(rewards.userId, userId),
        eq(rewards.status, RewardStatusEnum.PENDING),
      ),
    });

    if (pending.length === 0) {
      return { claimedCount: 0, totalAmount: 0, newBalance: wallet.balance };
    }

    const now = new Date().toISOString();
    const totalAmount = pending.reduce((sum, r) => sum + r.amount, 0);

    return await db.transaction(async (tx) => {
      await tx
        .update(rewards)
        .set({
          status: RewardStatusEnum.CLAIMED,
          claimedAt: now,
          updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        })
        .where(
          and(
            eq(rewards.userId, userId),
            eq(rewards.status, RewardStatusEnum.PENDING),
          ),
        );

      await tx.insert(transactions).values(
        pending.map((r) => ({
          walletId: wallet.id,
          userId,
          type: TransactionTypeEnum.CREDIT,
          amount: r.amount,
          currency: wallet.defaultCurrency,
          amountInBase: r.amount,
          description: r.description ?? 'Reward claimed',
          referenceId: r.id,
          referenceType: 'reward',
          status: TransactionStatusEnum.COMPLETED,
          completedAt: now,
        })),
      );

      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${totalAmount}`,
          totalEarned: sql`${wallets.totalEarned} + ${totalAmount}`,
          lastActivityAt: now,
          updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        })
        .where(eq(wallets.id, wallet.id))
        .returning();

      return {
        claimedCount: pending.length,
        totalAmount,
        newBalance: updatedWallet.balance,
      };
    });
  }

  /** Breakdown by activity type, for the earnings charts. */
  async getEarningsByType(
    userId: string,
    since?: string,
  ): Promise<Array<{ type: RewardType; total: number; count: number }>> {
    const conditions = [
      eq(rewards.userId, userId),
      eq(rewards.status, RewardStatusEnum.CLAIMED),
    ];
    if (since) conditions.push(gte(rewards.createdAt, since));

    const rows = await db
      .select({
        type: rewards.type,
        total: sql<number>`sum(${rewards.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(rewards)
      .where(and(...conditions))
      .groupBy(rewards.type);

    return rows.map((r) => ({
      type: r.type,
      total: Number(r.total ?? 0),
      count: Number(r.count ?? 0),
    }));
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * libSQL surfaces constraint failures as plain errors with driver-specific text,
 * so this matches on message rather than a typed error class.
 */
function isUniqueViolation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('UNIQUE constraint failed') ||
    message.includes('SQLITE_CONSTRAINT_UNIQUE') ||
    message.includes('SQLITE_CONSTRAINT')
  );
}

export const rewardsService = new RewardsService();

// ============================================
// AD WATCHES SERVICE
// ============================================

export class AdWatchesService {
  async getTodayAdWatches(userId: string): Promise<AdWatch[]> {
    return adWatchesRepository.getTodayAdWatches(userId);
  }

  async getUserAdEarnings(userId: string): Promise<number> {
    return adWatchesRepository.getTodayAdEarnings(userId);
  }

  /** Starts a watch session; caps enforced at completion, not start. */
  async startAdWatch(
    userId: string,
    input: CreateAdWatchInput,
  ): Promise<AdWatch> {
    const limits = await getUserDailyLimits(userId);
    const todayCount = (await adWatchesRepository.getTodayAdWatches(userId))
      .length;
    if (todayCount >= limits.maxDailyAds) {
      throw new Error(
        `You've reached your plan's daily ad limit (${limits.maxDailyAds}). Upgrade your plan to watch more ads per day.`,
      );
    }

    return adWatchesRepository.create({
      userId,
      advertiser: input.advertiser,
      rewardAmount: input.rewardAmount,
    });
  }

  /**
   * Marks the watch complete and credits the reward through rewardsService,
   * so ad earnings flow through the same ledger/balance contract as every
   * other earning activity.
   */
  async completeAdWatch(
    userId: string,
    adWatchId: string,
    watchDuration: number,
  ): Promise<{ adWatch: AdWatch; result: CreateRewardResult }> {
    const adWatch = await adWatchesRepository.completeAd(
      adWatchId,
      watchDuration,
    );
    if (!adWatch || adWatch.userId !== userId) {
      throw new Error('Ad watch not found');
    }

    const result = await rewardsService.createReward({
      userId,
      type: RewardTypeEnum.AD_WATCH,
      baseAmount: adWatch.rewardAmount,
      description: `Watched ad: ${adWatch.advertiser}`,
      sourceId: adWatch.id,
      sourceType: 'ad_watch',
      scope: 'once',
    });

    if (result.credited) {
      await adWatchesRepository.claimAdReward(adWatchId);
    }

    return { adWatch, result };
  }
}

export const adWatchesService = new AdWatchesService();

// ============================================
// DAILY BONUS SERVICE
// ============================================

const DAILY_BONUS_BASE = 100;
const STREAK_MILESTONES: Record<number, number> = {
  7: 500,
  14: 1000,
  30: 3000,
};

export class DailyBonusesService {
  /** Returns today's bonus row, creating an unclaimed one if it doesn't exist yet. */
  async getOrCreateTodayBonus(userId: string): Promise<DailyBonus> {
    const existing = await dailyBonusesRepository.getTodayBonus(userId);
    if (existing) return existing;

    const streak = (await dailyBonusesRepository.getStreakCount(userId)) + 1;
    const today = new Date().toISOString().slice(0, 10);

    return dailyBonusesRepository.create({
      userId,
      streakDay: streak,
      bonusAmount: DAILY_BONUS_BASE + (STREAK_MILESTONES[streak] ?? 0),
      date: today,
      claimed: false,
    });
  }

  /**
   * Claims today's bonus and credits it through rewardsService, so it flows
   * through the same ledger/balance contract as every other earning activity.
   */
  async claimTodayBonus(
    userId: string,
  ): Promise<{ bonus: DailyBonus; result: CreateRewardResult }> {
    const bonus = await this.getOrCreateTodayBonus(userId);
    if (bonus.claimed) {
      throw new Error('Daily bonus already claimed today');
    }

    const result = await rewardsService.createReward({
      userId,
      type: RewardTypeEnum.DAILY_BONUS,
      baseAmount: bonus.bonusAmount,
      description: `Daily bonus (day ${bonus.streakDay} streak)`,
      sourceId: bonus.id,
      sourceType: 'daily_bonus',
      scope: bonus.date,
    });

    if (result.credited) {
      await dailyBonusesRepository.claimBonus(bonus.id);
    }

    return { bonus, result };
  }

  async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    totalEarned: number;
    recentBonuses: DailyBonus[];
    nextMilestone: { day: number; bonus: number } | null;
  }> {
    const [currentStreak, totalEarned, recentBonuses] = await Promise.all([
      dailyBonusesRepository.getStreakCount(userId),
      dailyBonusesRepository.getTotalBonusEarned(userId),
      dailyBonusesRepository.getUserBonuses(userId, 30),
    ]);

    const milestoneDays = Object.keys(STREAK_MILESTONES)
      .map(Number)
      .sort((a, b) => a - b);
    const nextDay = milestoneDays.find((day) => day > currentStreak);

    return {
      currentStreak,
      totalEarned,
      recentBonuses,
      nextMilestone: nextDay
        ? { day: nextDay, bonus: STREAK_MILESTONES[nextDay] }
        : null,
    };
  }
}

export const dailyBonusesService = new DailyBonusesService();
