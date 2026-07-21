//src/lib/db/schema/badges.ts
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
  index,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// ENUMS
// ============================================
export const BadgeTierEnum = {
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;

export type BadgeTier = (typeof BadgeTierEnum)[keyof typeof BadgeTierEnum];
export const BADGE_TIER_LIST = Object.values(BadgeTierEnum);

// ============================================
// BADGES TABLE (available badges)
// ============================================
export const badges = sqliteTable(
  'badges',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    tier: text('tier').$type<BadgeTier>().notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),

    // Benefits
    earningsBoost: real('earningsBoost').notNull(), // e.g., 0.15 for 15%
    oneTimeReward: real('oneTimeReward').notNull(),

    // Pricing
    price: real('price').notNull(),

    // Features (JSON)
    features: text('features', { mode: 'json' }).$type<string[]>().notNull(),

    // Metadata
    icon: text('icon'), // emoji or icon URL
    color: text('color'),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [index('badges_tier_idx').on(table.tier)],
);

// ============================================
// USER BADGES TABLE
// ============================================
export const userBadges = sqliteTable(
  'user_badges',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: text('badgeId')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),

    // Status
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),

    // Purchase details
    purchasedAt: text('purchasedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    expiredAt: text('expiredAt'), // null = never expires (lifetime)

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('user_badges_user_idx').on(table.userId),
    index('user_badges_badge_idx').on(table.badgeId),
    index('user_badges_active_idx').on(table.isActive),
    // Unique per user per badge
    index('user_badges_user_badge_idx').on(table.userId, table.badgeId),
  ],
);

// ============================================
// SUBSCRIPTIONS TABLE
// ============================================
export const subscriptionPlans = sqliteTable(
  'subscription_plans',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    name: text('name').notNull(),
    description: text('description'),
    tier: text('tier').notNull(), // STARTER, SILVER, GOLD, PLATINUM

    // Pricing
    priceMonthly: real('priceMonthly').notNull(),
    priceYearly: real('priceYearly'),

    // Daily earnings
    dailyEarnings: real('dailyEarnings').notNull(),

    // Features (JSON)
    features: text('features', { mode: 'json' }).$type<string[]>().notNull(),

    // Limits
    maxDailyVideos: integer('maxDailyVideos').notNull().default(10),
    maxDailyGames: integer('maxDailyGames').notNull().default(5),
    maxDailyAds: integer('maxDailyAds').notNull().default(10),
    maxDailySurveys: integer('maxDailySurveys').notNull().default(3),

    // Additional benefits
    badgeBoost: real('badgeBoost').notNull().default(0),
    priorityWithdrawal: integer('priorityWithdrawal', { mode: 'boolean' })
      .notNull()
      .default(false),
    vipSupport: integer('vipSupport', { mode: 'boolean' })
      .notNull()
      .default(false),

    // Status
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('subscription_plans_tier_idx').on(table.tier),
    index('subscription_plans_active_idx').on(table.isActive),
  ],
);

// ============================================
// USER SUBSCRIPTIONS TABLE
// ============================================
export const userSubscriptions = sqliteTable(
  'user_subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: text('planId')
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: 'restrict' }),

    // Status
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, CANCELLED, EXPIRED

    // Dates
    startsAt: text('startsAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    expiresAt: text('expiresAt'),
    cancelledAt: text('cancelledAt'),

    // Billing
    billingCycle: text('billingCycle').notNull().default('MONTHLY'), // MONTHLY, YEARLY
    autoRenew: integer('autoRenew', { mode: 'boolean' })
      .notNull()
      .default(true),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('user_subscriptions_user_idx').on(table.userId),
    index('user_subscriptions_plan_idx').on(table.planId),
    index('user_subscriptions_status_idx').on(table.status),
    index('user_subscriptions_expires_idx').on(table.expiresAt),
  ],
);

// ============================================
// TYPES
// ============================================
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    userSubscriptions: many(userSubscriptions),
  }),
);

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [userSubscriptions.userId],
      references: [users.id],
    }),
    plan: one(subscriptionPlans, {
      fields: [userSubscriptions.planId],
      references: [subscriptionPlans.id],
    }),
  }),
);
