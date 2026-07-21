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
import { TIERS, type TierConfig } from '@/lib/constants/tiers';

// Helper to convert tier config to subscription plan
function tierToPlan(tier: TierConfig, baseCurrency: string = 'RWF'): any {
  const isFree = tier.value === 'FREE';

  // Price mapping based on tier
  const priceMap: Record<string, { monthly: number; yearly: number }> = {
    FREE: { monthly: 0, yearly: 0 },
    STARTER: { monthly: 6000, yearly: 60000 },
    SILVER: { monthly: 15000, yearly: 150000 },
    GOLD: { monthly: 30000, yearly: 300000 },
    PLATINUM: { monthly: 60000, yearly: 600000 },
    PREMIUM: { monthly: 120000, yearly: 1200000 },
  };

  // Daily earning estimation based on tier
  const dailyEarningMap: Record<string, number> = {
    FREE: 30,
    STARTER: 80,
    SILVER: 220,
    GOLD: 500,
    PLATINUM: 1100,
    PREMIUM: 2500,
  };

  // Feature mapping
  const featureMap: Record<string, string[]> = {
    FREE: [
      'Watch videos & earn',
      'Play games & earn',
      'Complete surveys',
      'Daily rewards',
      'Referral program',
    ],
    STARTER: [
      'Double earning limits',
      'Priority access to premium content',
      'Ad-free experience',
      'Exclusive games & surveys',
      'Basic analytics',
    ],
    SILVER: [
      'Triple earning limits',
      'Priority withdrawals',
      'Exclusive content library',
      'Premium support',
      'Advanced analytics',
      'Content creation tools',
    ],
    GOLD: [
      'Premium earning opportunities',
      'VIP support',
      'Content monetization',
      'Revenue sharing',
      'Early access to new features',
      'Verified badge',
      'Creator dashboard',
    ],
    PLATINUM: [
      'Unlimited earning potential',
      'Premium VIP support',
      'Higher revenue share',
      'Exclusive content & events',
      'Instant payouts',
      'Elite badge',
      'Personal account manager',
      'Creator fund access',
    ],
    PREMIUM: [
      'Maximum earning potential',
      'Ultimate VIP support',
      'Highest revenue share',
      'All content unlocked',
      'Exclusive partnerships',
      'Premium elite badge',
      'Invite-only events',
      'Platform revenue share',
    ],
  };

  const price = isFree ? 0 : priceMap[tier.value]?.monthly || 0;
  const yearlyPrice = isFree ? 0 : priceMap[tier.value]?.yearly || 0;
  const dailyEarnings = dailyEarningMap[tier.value] || 0;

  return {
    name: `${tier.label} Plan`,
    description: tier.description,
    tier: tier.value,
    priceMonthly: price,
    priceYearly: yearlyPrice,
    dailyEarnings: dailyEarnings,
    features: featureMap[tier.value] || tier.features,
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
  const tierOrder = [
    'FREE',
    'STARTER',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'PREMIUM',
  ];

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

      // Log earning potential
      const monthlyEarnings = planData.dailyEarnings * 30;
      console.log(
        `       📊 Daily: ${planData.dailyEarnings} RWF | Monthly: ~${monthlyEarnings.toLocaleString()} RWF`,
      );
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
