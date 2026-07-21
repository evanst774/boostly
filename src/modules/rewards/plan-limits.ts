// src/modules/rewards/plan-limits.ts
import { userSubscriptionsRepository } from '@/modules/badges/repository';
import { TIERS } from '@/lib/constants/tiers';

export interface DailyLimits {
  maxDailyVideos: number;
  maxDailyGames: number;
  maxDailyAds: number;
  maxDailySurveys: number;
}

/**
 * A user's per-day item caps, from their active subscription plan.
 * Users with no active subscription are implicitly FREE-tier.
 */
export async function getUserDailyLimits(userId: string): Promise<DailyLimits> {
  const activeSubscription =
    await userSubscriptionsRepository.getActiveByUserId(userId);

  if (activeSubscription?.plan) {
    const { maxDailyVideos, maxDailyGames, maxDailyAds, maxDailySurveys } =
      activeSubscription.plan;
    return { maxDailyVideos, maxDailyGames, maxDailyAds, maxDailySurveys };
  }

  const free = TIERS.FREE.metadata;
  return {
    maxDailyVideos: free.maxDailyVideos,
    maxDailyGames: free.maxDailyGames,
    maxDailyAds: free.maxDailyAds,
    maxDailySurveys: free.maxDailySurveys,
  };
}
