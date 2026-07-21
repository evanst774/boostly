// src/modules/referrals/repository.ts
import { db } from '@/lib/db';
import {
  referrals,
  type Referral,
  type NewReferral,
  referralCodes,
  type ReferralCode,
} from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

// ============================================
// REFERRAL CODES REPOSITORY
// ============================================
export class ReferralCodesRepository {
  async create(userId: string, code: string): Promise<ReferralCode> {
    const [referralCode] = await db
      .insert(referralCodes)
      .values({
        id: crypto.randomUUID(),
        userId,
        code: code.toUpperCase(),
        isActive: true,
        timesUsed: 0,
      })
      .returning();
    return referralCode;
  }

  async getByUserId(userId: string): Promise<ReferralCode | undefined> {
    return await db.query.referralCodes.findFirst({
      where: eq(referralCodes.userId, userId),
    });
  }

  async getByCode(code: string): Promise<ReferralCode | undefined> {
    return await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, code.toUpperCase()),
      with: { user: true },
    });
  }

  async getOrCreate(userId: string): Promise<ReferralCode> {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;

    // Generate unique code
    let code = this.generateCode(userId);
    let attempts = 0;
    let exists = true;

    while (exists && attempts < 10) {
      const existingCode = await this.getByCode(code);
      if (!existingCode) {
        exists = false;
      } else {
        code = this.generateCode(userId);
        attempts++;
      }
    }

    return await this.create(userId, code);
  }

  private generateCode(userId: string): string {
    // Take first 4 chars of userId + random 4 chars
    const prefix = userId.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  }

  async incrementUsage(code: string): Promise<ReferralCode | undefined> {
    const [updated] = await db
      .update(referralCodes)
      .set({
        timesUsed: sql`${referralCodes.timesUsed} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referralCodes.code, code.toUpperCase()))
      .returning();
    return updated;
  }

  async deactivate(code: string): Promise<ReferralCode | undefined> {
    const [updated] = await db
      .update(referralCodes)
      .set({
        isActive: false,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referralCodes.code, code.toUpperCase()))
      .returning();
    return updated;
  }

  async getStats(): Promise<{
    totalCodes: number;
    activeCodes: number;
    totalUses: number;
  }> {
    const [total, active, uses] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(referralCodes),
      db
        .select({ count: sql<number>`count(*)` })
        .from(referralCodes)
        .where(eq(referralCodes.isActive, true)),
      db
        .select({ sum: sql<number>`sum(${referralCodes.timesUsed})` })
        .from(referralCodes),
    ]);

    return {
      totalCodes: Number(total[0]?.count ?? 0),
      activeCodes: Number(active[0]?.count ?? 0),
      totalUses: Number(uses[0]?.sum ?? 0),
    };
  }
}

// ============================================
// REFERRALS REPOSITORY
// ============================================
export class ReferralsRepository {
  async create(data: NewReferral): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return referral;
  }

  async getById(id: string): Promise<Referral | undefined> {
    return await db.query.referrals.findFirst({
      where: eq(referrals.id, id),
      with: {
        referrer: true,
        referee: true,
      },
    });
  }

  async getByReferrerId(
    referrerId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ referrals: Referral[]; total: number }> {
    const conditions = [eq(referrals.referrerId, referrerId)];

    if (filters?.status) {
      conditions.push(eq(referrals.status, filters.status));
    }

    const whereClause = and(...conditions);
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const [items, totalResult] = await Promise.all([
      db.query.referrals.findMany({
        where: whereClause,
        with: {
          referrer: true,
          referee: true,
        },
        limit,
        offset,
        orderBy: [desc(referrals.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(whereClause),
    ]);

    return {
      referrals: items,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async getByRefereeId(refereeId: string): Promise<Referral | undefined> {
    return await db.query.referrals.findFirst({
      where: eq(referrals.refereeId, refereeId),
      with: {
        referrer: true,
        referee: true,
      },
    });
  }

  async getActiveReferrals(referrerId: string): Promise<Referral[]> {
    return await db.query.referrals.findMany({
      where: and(
        eq(referrals.referrerId, referrerId),
        eq(referrals.status, 'ACTIVE'),
      ),
      with: {
        referee: true,
      },
      orderBy: [desc(referrals.createdAt)],
    });
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<Referral | undefined> {
    const [updated] = await db
      .update(referrals)
      .set({
        status,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async claimReferrerReward(id: string): Promise<Referral | undefined> {
    const [updated] = await db
      .update(referrals)
      .set({
        referrerRewardClaimed: true,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async claimRefereeReward(id: string): Promise<Referral | undefined> {
    const [updated] = await db
      .update(referrals)
      .set({
        refereeRewardClaimed: true,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async activateReferral(id: string): Promise<Referral | undefined> {
    const [updated] = await db
      .update(referrals)
      .set({
        status: 'ACTIVE',
        activatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async getReferralStats(referrerId: string): Promise<{
    total: number;
    active: number;
    pending: number;
    completed: number;
    totalEarned: number;
  }> {
    const [total, active, pending, completed, earned] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(eq(referrals.referrerId, referrerId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referrerId),
            eq(referrals.status, 'ACTIVE'),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referrerId),
            eq(referrals.status, 'PENDING'),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referrerId),
            eq(referrals.status, 'COMPLETED'),
          ),
        ),
      db
        .select({ sum: sql<number>`sum(${referrals.referrerReward})` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referrerId),
            eq(referrals.referrerRewardClaimed, true),
          ),
        ),
    ]);

    return {
      total: Number(total[0]?.count ?? 0),
      active: Number(active[0]?.count ?? 0),
      pending: Number(pending[0]?.count ?? 0),
      completed: Number(completed[0]?.count ?? 0),
      totalEarned: Number(earned[0]?.sum ?? 0),
    };
  }

  async getGlobalStats(): Promise<{
    totalReferrals: number;
    totalReferrers: number;
    totalRewardsPaid: number;
  }> {
    const [total, referrers, rewards] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(referrals),
      db
        .select({ count: sql<number>`count(distinct ${referrals.referrerId})` })
        .from(referrals),
      db
        .select({ sum: sql<number>`sum(${referrals.referrerReward})` })
        .from(referrals)
        .where(eq(referrals.referrerRewardClaimed, true)),
    ]);

    return {
      totalReferrals: Number(total[0]?.count ?? 0),
      totalReferrers: Number(referrers[0]?.count ?? 0),
      totalRewardsPaid: Number(rewards[0]?.sum ?? 0),
    };
  }
}

// ============================================
// EXPORT REPOSITORIES
// ============================================
export const referralCodesRepository = new ReferralCodesRepository();
export const referralsRepository = new ReferralsRepository();
