// src/modules/rewards/plan-limits.ts
import { userSubscriptionsRepository } from '@/modules/badges/repository';
import { TIERS } from '@/lib/constants/tiers';

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
}

/**
 * The user's active plan and its per-day caps.
 * Users with no active subscription are implicitly FREE-tier.
 */
export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  const active = await userSubscriptionsRepository.getActiveByUserId(userId);

  if (active?.plan) {
    const { maxDailyVideos, maxDailyGames, maxDailyAds, maxDailySurveys } =
      active.plan;
    return {
      tier: active.plan.tier,
      name: active.plan.name,
      isFree: active.plan.tier === 'FREE',
      expiresAt: active.expiresAt ?? null,
      limits: { maxDailyVideos, maxDailyGames, maxDailyAds, maxDailySurveys },
    };
  }

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
  };
}

/** A user's per-day item caps, from their active subscription plan. */
export async function getUserDailyLimits(userId: string): Promise<DailyLimits> {
  return (await getUserPlan(userId)).limits;
}
