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
import { kigaliDayStartIso } from '@/lib/constants/payouts';

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
  /**
   * Max rewards of this `type` the user may receive today (plan quota).
   * Enforced atomically in the same INSERT that records the reward, so two
   * simultaneous requests can never both slip under the cap.
   */
  dailyCap?: number;
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
      reason: 'ALREADY_CREDITED' | 'ZERO_AMOUNT' | 'DAILY_LIMIT';
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
  // Small rewards (< one step) are paid as whole RWF instead of rounding to 0.
  if (amount > 0 && amount < ROUNDING_STEP) return Math.max(1, Math.round(amount));
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
      // One libSQL batch = one atomic transaction sent in a single request.
      // Unlike an interactive transaction it holds no lock between network
      // round trips, so concurrent payouts don't hit SQLITE_BUSY.
      //   1. reward row  - only if under today's plan cap (atomic check)
      //   2. ledger row  - only if (1) inserted
      //   3. wallet      - only if (1) inserted
      // A duplicate dedupeKey fails (1) with a unique violation and the whole
      // batch rolls back, which is reported as ALREADY_CREDITED below.
      const rewardId = crypto.randomUUID();
      const rewardInserted = sql`EXISTS (SELECT 1 FROM ${rewards} WHERE ${rewards.id} = ${rewardId})`;
      const meta = JSON.stringify({
        ...input.metadata,
        badgeBoost: multiplier.badgeBoost,
        planBoost: multiplier.planBoost,
      });
      const capCondition =
        input.dailyCap === undefined
          ? sql`1 = 1`
          : sql`(
              SELECT count(*) FROM ${rewards}
              WHERE ${rewards.userId} = ${input.userId}
                AND ${rewards.type} = ${input.type}
                AND ${rewards.status} = ${RewardStatusEnum.CLAIMED}
                AND ${rewards.createdAt} >= ${kigaliDayStartIso()}
            ) < ${input.dailyCap}`;

      const [insertResult] = await db.batch([
        db.run(sql`
          INSERT INTO ${rewards} (
            "id", "userId", "type", "amount", "baseAmount", "multiplier",
            "description", "sourceId", "sourceType", "dedupeKey", "status",
            "claimedAt", "metadata"
          )
          SELECT
            ${rewardId}, ${input.userId}, ${input.type}, ${amount},
            ${input.baseAmount}, ${multiplier.total}, ${input.description},
            ${input.sourceId}, ${input.sourceType}, ${dedupeKey},
            ${RewardStatusEnum.CLAIMED}, ${now}, ${meta}
          WHERE ${capCondition}
        `),
        // Ledger entry. unified-wallet.service reads THIS for earnings stats.
        db.run(sql`
          INSERT INTO ${transactions} (
            "id", "walletId", "userId", "type", "amount", "currency",
            "amountInBase", "description", "referenceId", "referenceType",
            "status", "completedAt"
          )
          SELECT
            ${crypto.randomUUID()}, ${wallet.id}, ${input.userId},
            ${TransactionTypeEnum.CREDIT}, ${amount}, ${wallet.defaultCurrency},
            ${amount}, ${input.description}, ${rewardId}, 'reward',
            ${TransactionStatusEnum.COMPLETED}, ${now}
          WHERE ${rewardInserted}
        `),
        // Relative update, never read-modify-write.
        db.run(sql`
          UPDATE ${wallets}
          SET "balance" = "balance" + ${amount},
              "totalEarned" = "totalEarned" + ${amount},
              "lastActivityAt" = ${now},
              "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE ${wallets.id} = ${wallet.id} AND ${rewardInserted}
        `),
      ]);

      if (!insertResult.rowsAffected) {
        return { credited: false, reason: 'DAILY_LIMIT', amount: 0 };
      }

      const [reward, updatedWallet] = await Promise.all([
        db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
        db.query.wallets.findFirst({ where: eq(wallets.id, wallet.id) }),
      ]);

      return {
        credited: true,
        reward: reward!,
        amount,
        baseAmount: input.baseAmount,
        multiplier: multiplier.total,
        newBalance: updatedWallet?.balance ?? 0,
      };
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
    const startOfDay = kigaliDayStartIso();

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

  /** Source ids (e.g. video ids) of rewards of this type paid today. */
  async getTodaySourceIds(userId: string, type: RewardType): Promise<Set<string>> {
    const rows = await db
      .select({ sourceId: rewards.sourceId })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.type, type),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          gte(rewards.createdAt, kigaliDayStartIso()),
        ),
      );
    return new Set(rows.map((r) => r.sourceId).filter((x): x is string => !!x));
  }

  /** Whether this exact reward (type + source + scope) was already paid. */
  async hasReward(
    userId: string,
    type: RewardType,
    sourceId: string,
    scope: string,
  ): Promise<boolean> {
    const row = await db.query.rewards.findFirst({
      where: and(
        eq(rewards.userId, userId),
        eq(rewards.dedupeKey, `${type}:${sourceId}:${scope}`),
      ),
      columns: { id: true },
    });
    return !!row;
  }

  /** How many rewards of a given type the user has earned today. Backs per-plan daily quotas. */
  async getTodayRewardCount(userId: string, type: RewardType): Promise<number> {
    const startOfDay = kigaliDayStartIso();

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
    const startOfToday = kigaliDayStartIso();
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
    const startOfDay = kigaliDayStartIso();
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
export function isUniqueViolation(err: unknown): boolean {
  // Drizzle wraps driver errors (DrizzleQueryError "Failed query: …") and keeps
  // the SQLite error in `.cause`, so walk the whole cause chain.
  let current: unknown = err;
  for (let depth = 0; current && depth < 5; depth++) {
    const e = current as { message?: unknown; code?: unknown; cause?: unknown };
    const text = `${String(e.message ?? current)} ${String(e.code ?? '')}`;
    if (
      text.includes('UNIQUE constraint failed') ||
      text.includes('SQLITE_CONSTRAINT_UNIQUE') ||
      text.includes('SQLITE_CONSTRAINT')
    ) {
      return true;
    }
    current = e.cause;
  }
  return false;
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

export class DailyBonusClaimedError extends Error {
  constructor() {
    super("You've already claimed today's bonus. Come back tomorrow!");
  }
}
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

    try {
      return await dailyBonusesRepository.create({
        userId,
        streakDay: streak,
        bonusAmount: DAILY_BONUS_BASE + (STREAK_MILESTONES[streak] ?? 0),
        date: today,
        claimed: false,
      });
    } catch (err) {
      // Two first visits at once: the unique (userId, date) index let the
      // other request create today's row. Use it.
      if (!isUniqueViolation(err)) throw err;
      const row = await dailyBonusesRepository.getTodayBonus(userId);
      if (!row) throw err;
      return row;
    }
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
      throw new DailyBonusClaimedError();
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

    // ALREADY_CREDITED means a parallel request paid it; mark it claimed too.
    if (result.credited || result.reason === 'ALREADY_CREDITED') {
      await dailyBonusesRepository.claimBonus(bonus.id);
    }
    if (!result.credited) throw new DailyBonusClaimedError();

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
