// src/modules/rewards/plan-limits.ts
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptionPlans } from '@/lib/db/schema';
import { userSubscriptionsRepository } from '@/modules/badges/repository';
import { TIERS, TIER_DAILY_MAX } from '@/lib/constants/tiers';
import { getWithdrawalIntervalDays } from '@/lib/constants/payouts';

export interface DailyLimits {
  maxDailyVideos: number;
  maxDailyGames: number;
  maxDailyAds: number;
  maxDailySurveys: number;
}

export interface UserPlanInfo {
  tier: string;
  name: string;
  isFree: boolean;
  expiresAt: string | null;
  limits: DailyLimits;
  /** Most RWF this member can earn from tasks today. 0 = no maximum. */
  dailyEarningsMax: number;
  /** Days between withdrawals (1 = every day). */
  withdrawalIntervalDays: number;
  /** Reward boost per task type (0.3 = +30%), from the plan. */
  boosts: { VIDEO: number; GAME: number; SURVEY: number; OTHER: number };
}

type PlanRow = typeof subscriptionPlans.$inferSelect;

function fromRow(plan: PlanRow, expiresAt: string | null): UserPlanInfo {
  const { maxDailyVideos, maxDailyGames, maxDailyAds, maxDailySurveys } = plan;
  return {
    tier: plan.tier,
    name: plan.name,
    isFree: plan.tier === 'FREE',
    expiresAt,
    limits: { maxDailyVideos, maxDailyGames, maxDailyAds, maxDailySurveys },
    dailyEarningsMax: Math.max(0, Number(plan.dailyEarnings) || 0),
    withdrawalIntervalDays: plan.withdrawalIntervalDays ?? getWithdrawalIntervalDays(plan.tier),
    boosts: {
      VIDEO: plan.videoBoost ?? plan.badgeBoost ?? 0,
      GAME: plan.gameBoost ?? plan.badgeBoost ?? 0,
      SURVEY: plan.surveyBoost ?? plan.badgeBoost ?? 0,
      OTHER: plan.badgeBoost ?? 0,
    },
  };
}

/**
 * The user's active plan, its per-day caps and withdrawal frequency, all as
 * set in Admin > Subscriptions. Users with no active subscription get the
 * Free plan row (falling back to built-in defaults if it doesn't exist).
 */
export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  const active = await userSubscriptionsRepository.getActiveByUserId(userId);
  if (active?.plan) return fromRow(active.plan as PlanRow, active.expiresAt ?? null);

  const freeRow = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.tier, 'FREE'),
  });
  if (freeRow) return { ...fromRow(freeRow, null), name: freeRow.name || 'Free Plan' };

  const free = TIERS.FREE.metadata;
  return {
    tier: 'FREE',
    name: 'Free Plan',
    isFree: true,
    expiresAt: null,
    limits: {
      maxDailyVideos: free.maxDailyVideos,
      maxDailyGames: free.maxDailyGames,
      maxDailyAds: free.maxDailyAds,
      maxDailySurveys: free.maxDailySurveys,
    },
    dailyEarningsMax: TIER_DAILY_MAX.FREE,
    withdrawalIntervalDays: getWithdrawalIntervalDays('FREE'),
    boosts: { VIDEO: 0, GAME: 0, SURVEY: 0, OTHER: 0 },
  };
}

/** A user's per-day item caps, from their active subscription plan. */
export async function getUserDailyLimits(userId: string): Promise<DailyLimits> {
  return (await getUserPlan(userId)).limits;
}
