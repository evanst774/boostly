// src/modules/badges/repository.ts
import { db } from '@/lib/db';
import {
  badges,
  type Badge,
  type NewBadge,
  userBadges,
  type UserBadge,
  type NewUserBadge,
  subscriptionPlans,
  type SubscriptionPlan,
  type NewSubscriptionPlan,
  userSubscriptions,
  type UserSubscription,
  type NewUserSubscription,
  type BadgeTier,
} from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

// ============================================
// BADGES REPOSITORY
// ============================================
export class BadgesRepository {
  async create(data: NewBadge): Promise<Badge> {
    const [badge] = await db
      .insert(badges)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return badge;
  }

  async getById(id: string): Promise<Badge | undefined> {
    return await db.query.badges.findFirst({
      where: eq(badges.id, id),
    });
  }

  // Fix: Use BadgeTier type instead of BadgeTierEnum
  async getByTier(tier: BadgeTier): Promise<Badge | undefined> {
    return await db.query.badges.findFirst({
      where: eq(badges.tier, tier),
    });
  }

  async getAll(): Promise<Badge[]> {
    return await db.query.badges.findMany({
      orderBy: [badges.price],
    });
  }

  async getActive(): Promise<Badge[]> {
    return await db.query.badges.findMany({
      // All badges are active by default
      orderBy: [badges.price],
    });
  }

  async update(
    id: string,
    data: Partial<NewBadge>,
  ): Promise<Badge | undefined> {
    const [updated] = await db
      .update(badges)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(badges.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(badges).where(eq(badges.id, id));
  }

  async getStats(): Promise<{ total: number }> {
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(badges);
    return { total: Number(total?.count ?? 0) };
  }
}

// ============================================
// USER BADGES REPOSITORY
// ============================================
export class UserBadgesRepository {
  async create(data: NewUserBadge): Promise<UserBadge> {
    const [userBadge] = await db
      .insert(userBadges)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return userBadge;
  }

  async getById(id: string): Promise<UserBadge | undefined> {
    return await db.query.userBadges.findFirst({
      where: eq(userBadges.id, id),
      with: { badge: true },
    });
  }

  async getByUserId(userId: string): Promise<UserBadge[]> {
    return await db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
      with: { badge: true },
      orderBy: [desc(userBadges.purchasedAt)],
    });
  }

  async getActiveByUserId(
    userId: string,
  ): Promise<(UserBadge & { badge: Badge }) | undefined> {
    return await db.query.userBadges.findFirst({
      where: and(eq(userBadges.userId, userId), eq(userBadges.isActive, true)),
      with: { badge: true },
    });
  }

  async getByUserAndBadge(
    userId: string,
    badgeId: string,
  ): Promise<UserBadge | undefined> {
    return await db.query.userBadges.findFirst({
      where: and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId),
      ),
      with: { badge: true },
    });
  }

  async deactivateAllUserBadges(userId: string): Promise<void> {
    await db
      .update(userBadges)
      .set({
        isActive: false,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(userBadges.userId, userId));
  }

  async activateBadge(id: string): Promise<UserBadge | undefined> {
    const [updated] = await db
      .update(userBadges)
      .set({
        isActive: true,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(userBadges.id, id))
      .returning();
    return updated;
  }

  async getUserBadgesWithDetails(userId: string): Promise<UserBadge[]> {
    return await db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
      with: { badge: true },
      orderBy: [desc(userBadges.purchasedAt)],
    });
  }

  async getStats(userId?: string): Promise<{
    totalPurchased: number;
    activeCount: number;
    totalSpent: number;
  }> {
    const conditions = userId ? [eq(userBadges.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [total, active, spent] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(userBadges)
        .where(whereClause),
      db
        .select({ count: sql<number>`count(*)` })
        .from(userBadges)
        .where(and(whereClause, eq(userBadges.isActive, true))),
      db
        .select({ sum: sql<number>`sum(${badges.price})` })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(whereClause),
    ]);

    return {
      totalPurchased: Number(total[0]?.count ?? 0),
      activeCount: Number(active[0]?.count ?? 0),
      totalSpent: Number(spent[0]?.sum ?? 0),
    };
  }
}

// ============================================
// SUBSCRIPTION PLANS REPOSITORY
// ============================================
export class SubscriptionPlansRepository {
  async create(data: NewSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return plan;
  }

  async getById(id: string): Promise<SubscriptionPlan | undefined> {
    return await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, id),
    });
  }

  async getByTier(tier: string): Promise<SubscriptionPlan | undefined> {
    return await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.tier, tier),
    });
  }

  async getAll(): Promise<SubscriptionPlan[]> {
    return await db.query.subscriptionPlans.findMany({
      where: eq(subscriptionPlans.isActive, true),
      orderBy: [subscriptionPlans.priceMonthly],
    });
  }

  async update(
    id: string,
    data: Partial<NewSubscriptionPlan>,
  ): Promise<SubscriptionPlan | undefined> {
    const [updated] = await db
      .update(subscriptionPlans)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  async getStats(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(subscriptionPlans),
      db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true)),
    ]);

    return {
      total: Number(total[0]?.count ?? 0),
      active: Number(active[0]?.count ?? 0),
    };
  }
}

// ============================================
// USER SUBSCRIPTIONS REPOSITORY
// ============================================
export class UserSubscriptionsRepository {
  async create(data: NewUserSubscription): Promise<UserSubscription> {
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return subscription;
  }

  async getById(id: string): Promise<UserSubscription | undefined> {
    return await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.id, id),
      with: { plan: true },
    });
  }

  async getByUserId(userId: string): Promise<UserSubscription | undefined> {
    return await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      with: { plan: true },
    });
  }

  async getActiveByUserId(
    userId: string,
  ): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined> {
    return await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'ACTIVE'),
        sql`${userSubscriptions.expiresAt} IS NULL OR ${userSubscriptions.expiresAt} > datetime('now')`,
      ),
      with: { plan: true },
    });
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<UserSubscription | undefined> {
    const [updated] = await db
      .update(userSubscriptions)
      .set({
        status,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updated;
  }

  async cancelSubscription(id: string): Promise<UserSubscription | undefined> {
    const [updated] = await db
      .update(userSubscriptions)
      .set({
        status: 'CANCELLED',
        cancelledAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        autoRenew: false,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updated;
  }

  async extendSubscription(
    id: string,
    expiresAt: string,
  ): Promise<UserSubscription | undefined> {
    const [updated] = await db
      .update(userSubscriptions)
      .set({
        expiresAt,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updated;
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    expired: number;
  }> {
    const [total, active, cancelled, expired] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(userSubscriptions),
      db
        .select({ count: sql<number>`count(*)` })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, 'ACTIVE')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, 'CANCELLED')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, 'EXPIRED')),
    ]);

    return {
      total: Number(total[0]?.count ?? 0),
      active: Number(active[0]?.count ?? 0),
      cancelled: Number(cancelled[0]?.count ?? 0),
      expired: Number(expired[0]?.count ?? 0),
    };
  }
}

// ============================================
// EXPORT REPOSITORIES
// ============================================
export const badgesRepository = new BadgesRepository();
export const userBadgesRepository = new UserBadgesRepository();
export const subscriptionPlansRepository = new SubscriptionPlansRepository();
export const userSubscriptionsRepository = new UserSubscriptionsRepository();
