// src/hooks/useBadges.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  type Badge,
  type UserBadge,
  type SubscriptionPlan,
  type UserSubscription,
  type BadgeTier,
} from '@/lib/db/schema';

// Re-export schema types for convenience
export type { Badge, UserBadge, SubscriptionPlan, UserSubscription, BadgeTier };

// Extend UserBadge to include the badge relation
export interface UserBadgeWithBadge extends Omit<UserBadge, 'badgeId'> {
  badge: Badge;
}

// Extend UserSubscription to include the plan relation
export interface UserSubscriptionWithPlan extends Omit<
  UserSubscription,
  'planId'
> {
  plan: SubscriptionPlan;
  daysRemaining?: number | null;
}

interface BadgesData {
  userBadges: UserBadgeWithBadge[];
  activeBadge: UserBadgeWithBadge | null;
  subscription: UserSubscriptionWithPlan | null;
  allBadges: Badge[];
  allPlans: SubscriptionPlan[];
}

export function useBadges() {
  const [data, setData] = useState<BadgesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    // Even without user, we can fetch public badges and plans
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [badgesRes, plansRes, userBadgesRes, subscriptionRes] =
        await Promise.all([
          fetch('/api/badges'),
          fetch('/api/subscriptions/plans'),
          user ? fetch('/api/badges/my') : Promise.resolve(null),
          user ? fetch('/api/subscriptions/my') : Promise.resolve(null),
        ]);

      // Each endpoint wraps its payload: { badges }, { plans },
      // { badges, active }, { subscription }.
      const badgesJson = badgesRes.ok ? await badgesRes.json() : null;
      const allBadges: Badge[] = Array.isArray(badgesJson)
        ? badgesJson
        : (badgesJson?.badges ?? []);

      const plansJson = plansRes.ok ? await plansRes.json() : null;
      const allPlans: SubscriptionPlan[] = (
        Array.isArray(plansJson) ? plansJson : (plansJson?.plans ?? [])
      ).filter((p: SubscriptionPlan) => p.isActive !== false);

      let userBadges: UserBadgeWithBadge[] = [];
      let activeBadge: UserBadgeWithBadge | null = null;
      let subscription: UserSubscriptionWithPlan | null = null;

      if (user && userBadgesRes?.ok) {
        const userBadgesData = await userBadgesRes.json();
        userBadges = userBadgesData.badges || [];
        activeBadge = userBadgesData.active || null;
      }

      if (user && subscriptionRes?.ok) {
        const subscriptionData = await subscriptionRes.json();
        subscription = subscriptionData?.subscription ?? null;
      }

      setData({
        userBadges,
        activeBadge,
        subscription,
        allBadges,
        allPlans,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch badges'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
