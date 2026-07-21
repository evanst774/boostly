// src/lib/db/seeds/rewards/rewards.seed.ts
import { db } from '@/lib/db';
import {
  rewards,
  dailyBonuses,
  adWatches,
  RewardStatusEnum,
} from '@/lib/db/schema/rewards';
import { eq, and } from 'drizzle-orm';
import type { AdWatch, DailyBonus, Reward, SeedRewardsResult } from '../types';

export async function seedRewards(): Promise<SeedRewardsResult> {
  console.log('  🎁 Seeding rewards...');

  const rewardList: Reward[] = [];
  const bonusList: DailyBonus[] = [];
  const adList: AdWatch[] = [];

  const userList = await db.query.users.findMany({
    limit: 10,
  });

  const rewardTypes = [
    'VIDEO',
    'GAME',
    'SURVEY',
    'DAILY_BONUS',
    'REFERRAL',
    'BADGE_BONUS',
    'SUBSCRIPTION_BONUS',
    'AD_WATCH',
  ];
  const rewardDescriptions = [
    'Video reward: How to start an online business',
    'Game reward: Bubble Pop',
    'Survey reward: MTN Customer Survey',
    'Daily bonus - Day 5 streak',
    'Referral bonus: Friend joined',
    'Gold Badge one-time reward',
    'Subscription bonus: Welcome to Starter Plan',
    'Ad reward: MTN Rwanda',
  ];

  for (const user of userList) {
    // ============================================
    // REWARDS
    // ============================================
    try {
      for (let i = 0; i < 3; i++) {
        const typeIndex = Math.floor(Math.random() * rewardTypes.length);
        const rewardType = rewardTypes[typeIndex];
        const baseAmount = Math.floor(Math.random() * 500) + 50;
        const multiplier = Math.random() > 0.5 ? 1 : 1.5;
        const amount = Math.round(baseAmount * multiplier);
        const status =
          Math.random() > 0.3
            ? RewardStatusEnum.CLAIMED
            : RewardStatusEnum.PENDING;

        const sourceId = crypto.randomUUID();
        const dedupeKey = `${rewardType}:${sourceId}:once`;

        const [reward] = await db
          .insert(rewards)
          .values({
            userId: user.id,
            type: rewardType as any,
            baseAmount: baseAmount,
            multiplier: multiplier,
            amount: amount,
            description:
              rewardDescriptions[typeIndex % rewardDescriptions.length],
            sourceId: sourceId,
            sourceType: rewardType.toLowerCase(),
            dedupeKey: dedupeKey,
            status: status,
            claimedAt:
              status === RewardStatusEnum.CLAIMED
                ? new Date().toISOString()
                : undefined,
          })
          .returning();
        rewardList.push(reward);
      }
      console.log(`    ✅ Created 3 rewards for ${user.name}`);
    } catch (error) {
      console.error(`    ❌ Failed to create rewards for ${user.name}:`, error);
    }

    // ============================================
    // DAILY BONUSES - with proper duplicate handling
    // ============================================
    try {
      for (let day = 1; day <= 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() - (7 - day));
        const dateStr = date.toISOString().split('T')[0];

        // ✅ Check if bonus already exists for this user/date
        const existing = await db.query.dailyBonuses.findFirst({
          where: and(
            eq(dailyBonuses.userId, user.id),
            eq(dailyBonuses.date, dateStr),
          ),
        });

        if (existing) {
          bonusList.push(existing);
          continue;
        }

        const bonusAmount = day <= 5 ? 100 : day <= 7 ? 500 : 1000;
        const claimed = day <= 5;

        const [bonus] = await db
          .insert(dailyBonuses)
          .values({
            userId: user.id,
            streakDay: day,
            bonusAmount: bonusAmount,
            date: dateStr,
            claimed: claimed,
            claimedAt: claimed ? date.toISOString() : undefined,
          })
          .returning();
        bonusList.push(bonus);
      }
      console.log(`    ✅ Created 7 daily bonuses for ${user.name}`);
    } catch (error) {
      console.error(
        `    ❌ Failed to create daily bonuses for ${user.name}:`,
        error,
      );
    }

    // ============================================
    // AD WATCHES
    // ============================================
    try {
      const advertisers = [
        'MTN Rwanda',
        'Bank of Kigali',
        'Carrefour Rwanda',
        'RSSB',
        'Airtel Rwanda',
      ];
      for (let i = 0; i < 3; i++) {
        const completed = Math.random() > 0.3;
        const [ad] = await db
          .insert(adWatches)
          .values({
            userId: user.id,
            advertiser: advertisers[i % advertisers.length],
            rewardAmount: Math.floor(Math.random() * 50) + 15,
            completed: completed,
            watchDuration: Math.floor(Math.random() * 30) + 15,
            rewardClaimed: completed && Math.random() > 0.3,
            startedAt: new Date().toISOString(),
            completedAt: completed ? new Date().toISOString() : undefined,
          })
          .returning();
        adList.push(ad);
      }
      console.log(`    ✅ Created 3 ad watches for ${user.name}`);
    } catch (error) {
      console.error(
        `    ❌ Failed to create ad watches for ${user.name}:`,
        error,
      );
    }
  }

  console.log(
    `    ✅ Created ${rewardList.length} rewards, ${bonusList.length} daily bonuses, ${adList.length} ad watches`,
  );

  return {
    rewards: rewardList,
    dailyBonuses: bonusList,
    adWatches: adList,
  };
}
