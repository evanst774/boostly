// src/modules/rewards/repository.ts
import { db } from '@/lib/db';
import {
  rewards,
  type Reward,
  type NewReward,
  dailyBonuses,
  type DailyBonus,
  type NewDailyBonus,
  adWatches,
  type AdWatch,
  type NewAdWatch,
  RewardStatusEnum,
  RewardTypeEnum,
  type RewardType,
  type RewardStatus,
} from '@/lib/db/schema';
import { eq, and, between, sql, desc } from 'drizzle-orm';

// ============================================
// REWARDS REPOSITORY
// ============================================
export class RewardsRepository {
  async create(data: NewReward): Promise<Reward> {
    const [reward] = await db
      .insert(rewards)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return reward;
  }

  async getById(id: string): Promise<Reward | undefined> {
    return await db.query.rewards.findFirst({
      where: eq(rewards.id, id),
    });
  }

  async getUserRewards(
    userId: string,
    filters?: {
      type?: RewardType;
      status?: RewardStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ rewards: Reward[]; total: number }> {
    const conditions = [eq(rewards.userId, userId)];

    if (filters?.type) conditions.push(eq(rewards.type, filters.type));
    if (filters?.status)
      conditions.push(eq(rewards.status, filters.status));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        between(rewards.createdAt, filters.startDate, filters.endDate),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const [items, totalResult] = await Promise.all([
      db.query.rewards.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(rewards.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(rewards)
        .where(whereClause),
    ]);

    return {
      rewards: items,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  // Use RewardTypeEnum type
  async getUserRewardsByType(
    userId: string,
    type: (typeof RewardTypeEnum)[keyof typeof RewardTypeEnum],
  ): Promise<Reward[]> {
    return await db.query.rewards.findMany({
      where: and(eq(rewards.userId, userId), eq(rewards.type, type)),
      orderBy: [desc(rewards.createdAt)],
    });
  }

  async getUnclaimedRewards(userId: string): Promise<Reward[]> {
    return await db.query.rewards.findMany({
      where: and(
        eq(rewards.userId, userId),
        eq(rewards.status, RewardStatusEnum.PENDING),
      ),
      orderBy: [desc(rewards.createdAt)],
    });
  }

  async claimReward(id: string): Promise<Reward | undefined> {
    const [updated] = await db
      .update(rewards)
      .set({
        status: RewardStatusEnum.CLAIMED,
        claimedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(rewards.id, id))
      .returning();
    return updated;
  }

  async updateReward(
    id: string,
    data: Partial<NewReward>,
  ): Promise<Reward | undefined> {
    const [updated] = await db
      .update(rewards)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(rewards.id, id))
      .returning();
    return updated;
  }

  async deleteReward(id: string): Promise<void> {
    await db.delete(rewards).where(eq(rewards.id, id));
  }

  async getUserTotalEarned(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`sum(${rewards.amount})`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getUserEarningsByType(userId: string): Promise<Record<string, number>> {
    const results = await db
      .select({
        type: rewards.type,
        total: sql<number>`sum(${rewards.amount})`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
        ),
      )
      .groupBy(rewards.type);

    return results.reduce(
      (acc, curr) => {
        acc[curr.type] = Number(curr.total);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async getTodayEarnings(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db
      .select({
        total: sql<number>`sum(${rewards.amount})`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          sql`date(${rewards.claimedAt}) = ${today}`,
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getWeeklyEarnings(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const result = await db
      .select({
        total: sql<number>`sum(${rewards.amount})`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          sql`${rewards.claimedAt} >= ${weekAgo.toISOString()}`,
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getMonthlyEarnings(userId: string): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const result = await db
      .select({
        total: sql<number>`sum(${rewards.amount})`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          sql`${rewards.claimedAt} >= ${monthAgo.toISOString()}`,
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getEarningsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`sum(${rewards.amount})`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          between(rewards.claimedAt, startDate, endDate),
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getEarningsByDay(
    userId: string,
    days: number = 7,
  ): Promise<Array<{ date: string; amount: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await db
      .select({
        date: sql<string>`date(${rewards.claimedAt})`,
        amount: sql<number>`sum(${rewards.amount})`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, userId),
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          sql`${rewards.claimedAt} >= ${startDate.toISOString()}`,
        ),
      )
      .groupBy(sql`date(${rewards.claimedAt})`)
      .orderBy(sql`date(${rewards.claimedAt})`);

    return results.map((r) => ({
      date: r.date,
      amount: Number(r.amount),
    }));
  }

  async getStats(): Promise<{
    totalRewards: number;
    totalAmount: number;
    pendingAmount: number;
    claimedAmount: number;
  }> {
    const [total, amount, pending, claimed] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(rewards),
      db.select({ sum: sql<number>`sum(${rewards.amount})` }).from(rewards),
      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(eq(rewards.status, RewardStatusEnum.PENDING)),
      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(eq(rewards.status, RewardStatusEnum.CLAIMED)),
    ]);

    return {
      totalRewards: Number(total[0]?.count ?? 0),
      totalAmount: Number(amount[0]?.sum ?? 0),
      pendingAmount: Number(pending[0]?.sum ?? 0),
      claimedAmount: Number(claimed[0]?.sum ?? 0),
    };
  }
}

// ============================================
// DAILY BONUSES REPOSITORY
// ============================================
export class DailyBonusesRepository {
  async create(data: NewDailyBonus): Promise<DailyBonus> {
    const [bonus] = await db
      .insert(dailyBonuses)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return bonus;
  }

  async getTodayBonus(userId: string): Promise<DailyBonus | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return await db.query.dailyBonuses.findFirst({
      where: and(eq(dailyBonuses.userId, userId), eq(dailyBonuses.date, today)),
    });
  }

  async getLastBonus(userId: string): Promise<DailyBonus | undefined> {
    return await db.query.dailyBonuses.findFirst({
      where: eq(dailyBonuses.userId, userId),
      orderBy: [desc(dailyBonuses.date)],
    });
  }

  async getUserBonuses(userId: string, limit?: number): Promise<DailyBonus[]> {
    return await db.query.dailyBonuses.findMany({
      where: eq(dailyBonuses.userId, userId),
      limit: limit,
      orderBy: [desc(dailyBonuses.date)],
    });
  }

  async getStreakCount(userId: string): Promise<number> {
    const bonuses = await db.query.dailyBonuses.findMany({
      where: eq(dailyBonuses.userId, userId),
      orderBy: [desc(dailyBonuses.date)],
    });

    if (bonuses.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const expectedDate = new Date(today);

    for (const bonus of bonuses) {
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (bonus.date === expectedDateStr && bonus.claimed) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (!bonus.claimed && bonus.date === expectedDateStr) {
        break;
      } else {
        break;
      }
    }

    return streak;
  }

  async getTotalBonusEarned(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`sum(${dailyBonuses.bonusAmount})`,
      })
      .from(dailyBonuses)
      .where(
        and(eq(dailyBonuses.userId, userId), eq(dailyBonuses.claimed, true)),
      );
    return Number(result[0]?.total ?? 0);
  }

  async claimBonus(id: string): Promise<DailyBonus | undefined> {
    const [updated] = await db
      .update(dailyBonuses)
      .set({
        claimed: true,
        claimedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(dailyBonuses.id, id))
      .returning();
    return updated;
  }
}

// ============================================
// AD WATCHES REPOSITORY
// ============================================
export class AdWatchesRepository {
  async create(data: NewAdWatch): Promise<AdWatch> {
    const [ad] = await db
      .insert(adWatches)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return ad;
  }

  async getByUserAndAd(
    userId: string,
    advertiser: string,
  ): Promise<AdWatch | undefined> {
    return await db.query.adWatches.findFirst({
      where: and(
        eq(adWatches.userId, userId),
        eq(adWatches.advertiser, advertiser),
      ),
      orderBy: [desc(adWatches.createdAt)],
    });
  }

  async getUserAdWatches(userId: string, limit?: number): Promise<AdWatch[]> {
    return await db.query.adWatches.findMany({
      where: eq(adWatches.userId, userId),
      limit: limit,
      orderBy: [desc(adWatches.createdAt)],
    });
  }

  async getTodayAdWatches(userId: string): Promise<AdWatch[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.query.adWatches.findMany({
      where: and(
        eq(adWatches.userId, userId),
        sql`date(${adWatches.createdAt}) = ${today}`,
      ),
    });
  }

  async getTodayAdEarnings(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db
      .select({
        total: sql<number>`sum(${adWatches.rewardAmount})`,
      })
      .from(adWatches)
      .where(
        and(
          eq(adWatches.userId, userId),
          eq(adWatches.rewardClaimed, true),
          sql`date(${adWatches.completedAt}) = ${today}`,
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async completeAd(
    id: string,
    watchDuration: number,
  ): Promise<AdWatch | undefined> {
    const [updated] = await db
      .update(adWatches)
      .set({
        completed: true,
        watchDuration,
        completedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(adWatches.id, id))
      .returning();
    return updated;
  }

  async claimAdReward(id: string): Promise<AdWatch | undefined> {
    const [updated] = await db
      .update(adWatches)
      .set({
        rewardClaimed: true,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(adWatches.id, id))
      .returning();
    return updated;
  }
}

// ============================================
// EXPORT REPOSITORIES
// ============================================
export const rewardsRepository = new RewardsRepository();
export const dailyBonusesRepository = new DailyBonusesRepository();
export const adWatchesRepository = new AdWatchesRepository();
