// src/lib/db/seeds/gamification/badges-subscriptions.seed.ts
import { db } from '@/lib/db';
import {
  badges,
  subscriptionPlans,
  BadgeTierEnum,
  type Badge,
  type SubscriptionPlan,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { SeedBadgesResult } from '../types';
import { TIERS, TIER_ORDER, TIER_PRICES, type TierConfig } from '@/lib/constants/tiers';

// Helper to convert tier config to subscription plan. Prices, limits and the
// per-task reward boost all come from lib/constants/tiers.ts (single source).
// dailyEarnings stays 0: there are no fixed earnings, only funded tasks.
function tierToPlan(tier: TierConfig): any {
  const price = TIER_PRICES[tier.value] ?? { monthly: 0, yearly: 0 };
  return {
    name: `${tier.label} Plan`,
    description: tier.description,
    tier: tier.value,
    priceMonthly: price.monthly,
    priceYearly: price.yearly,
    dailyEarnings: 0,
    features: tier.features,
    maxDailyVideos: tier.metadata.maxDailyVideos,
    maxDailyGames: tier.metadata.maxDailyGames,
    maxDailyAds: tier.metadata.maxDailyAds,
    maxDailySurveys: tier.metadata.maxDailySurveys,
    badgeBoost: tier.metadata.badgeBoost,
    priorityWithdrawal: tier.metadata.priorityWithdrawal,
    vipSupport: tier.metadata.vipSupport,
    isActive: true,
  };
}

export async function seedBadges(): Promise<SeedBadgesResult> {
  console.log('  🏅 Seeding Boostly badges & subscriptions...');

  // ============================================
  // 1. Badges
  // ============================================
  const badgeData = [
    {
      tier: BadgeTierEnum.SILVER,
      name: 'Silver Badge',
      description: 'Boost your earnings by 15% with the Silver Badge.',
      earningsBoost: 0.15,
      oneTimeReward: 5000,
      price: 5000,
      features: ['+15% earnings boost', 'Priority support'],
      icon: '🥈',
      color: '#94A3B8',
    },
    {
      tier: BadgeTierEnum.GOLD,
      name: 'Gold Badge',
      description: 'Get a 30% earnings boost and VIP support.',
      earningsBoost: 0.3,
      oneTimeReward: 10000,
      price: 10000,
      features: ['+30% earnings boost', 'VIP support', 'Exclusive games'],
      icon: '🥇',
      color: '#F59E0B',
    },
    {
      tier: BadgeTierEnum.PLATINUM,
      name: 'Platinum Badge',
      description: 'Maximum earnings boost with premium VIP perks.',
      earningsBoost: 0.3,
      oneTimeReward: 20000,
      price: 20000,
      features: [
        '+30% earnings boost',
        'Premium VIP support',
        'Exclusive games',
        'Faster withdrawals',
      ],
      icon: '💎',
      color: '#8B5CF6',
    },
  ];

  const badgeList: Badge[] = [];

  for (const badge of badgeData) {
    let existing = await db.query.badges.findFirst({
      where: eq(badges.tier, badge.tier),
    });

    if (!existing) {
      const [newBadge] = await db.insert(badges).values(badge).returning();
      badgeList.push(newBadge);
      console.log(`    ✅ Created badge: ${badge.name}`);
    } else {
      badgeList.push(existing);
      console.log(`    ⚠️ Badge exists: ${badge.name}`);
    }
  }

  // ============================================
  // 2. Subscription Plans (using TIERS system)
  // ============================================
  console.log('  📋 Seeding subscription plans from TIERS...');

  const planList: SubscriptionPlan[] = [];
  const tierOrder = TIER_ORDER;

  for (const tierKey of tierOrder) {
    const tier = TIERS[tierKey];
    if (!tier) continue;

    const planData = tierToPlan(tier);

    let existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.tier, planData.tier),
    });

    if (!existing) {
      const [newPlan] = await db
        .insert(subscriptionPlans)
        .values({
          ...planData,
          isActive: true,
        })
        .returning();
      planList.push(newPlan);
      console.log(`    ✅ Created subscription plan: ${planData.name}`);

    } else {
      planList.push(existing);
      console.log(`    ⚠️ Subscription plan exists: ${planData.name}`);
    }
  }

  console.log(
    `   ✅ ${badgeList.length} badges, ${planList.length} subscription plans seeded`,
  );

  return {
    badges: badgeList,
    subscriptionPlans: planList,
  };
}
