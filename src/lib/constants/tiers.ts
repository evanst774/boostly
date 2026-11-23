// src/lib/constants/tiers.ts

export interface TierConfig {
  value: string;
  label: string;
  emoji: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
  description: string;
  features: string[];
  metadata: {
    // Earning potential (not guaranteed)
    maxDailyVideos: number;
    maxDailyGames: number;
    maxDailyAds: number;
    maxDailySurveys: number;
    badgeBoost: number;
    priorityWithdrawal: boolean;
    vipSupport: boolean;
    // Content creation & engagement features
    canCreateContent: boolean;
    canMonetize: boolean;
    revenueShare: number; // percentage
    earlyAccess: boolean;
    analytics: boolean;
    customBadge: boolean;
    // New: Earning approximations
    estimatedDailyEarnings: number;
    estimatedMonthlyEarnings: number;
    estimatedYearlyEarnings: number;
    estimatedROI: string;
  };
}

export const TIERS: Record<string, TierConfig> = {
  FREE: {
    value: 'FREE',
    label: 'Free',
    emoji: '👤',
    icon: 'User',
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    badgeColor: 'bg-gray-100 text-gray-700',
    description: 'Start earning with a few tasks a day',
    features: ["A few sponsored tasks every day", "Withdraw once a week", "Referral commissions"],
    metadata: {
      maxDailyVideos: 5,
      maxDailyGames: 3,
      maxDailyAds: 5,
      maxDailySurveys: 2,
      // Reward per task = content reward x (1 + badgeBoost). Paid only from
      // real campaign budgets and the admin's daily reward budget.
      badgeBoost: 0.0,
      priorityWithdrawal: false,
      vipSupport: false,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: false,
      customBadge: false,
      // No fixed earnings: what a member earns depends on available sponsored
      // budgets. Kept at 0 so nothing displays a guaranteed figure.
      estimatedDailyEarnings: 0,
      estimatedMonthlyEarnings: 0,
      estimatedYearlyEarnings: 0,
      estimatedROI: '',
    },
  },
  BASIC: {
    value: 'BASIC',
    label: 'Basic',
    emoji: '🌱',
    icon: 'Sprout',
    color: '#10B981',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    description: 'The most tasks every day',
    features: ["Most daily tasks of any plan", "Withdraw every day", "Standard reward per task"],
    metadata: {
      maxDailyVideos: 30,
      maxDailyGames: 12,
      maxDailyAds: 30,
      maxDailySurveys: 6,
      // Reward per task = content reward x (1 + badgeBoost). Paid only from
      // real campaign budgets and the admin's daily reward budget.
      badgeBoost: 0.0,
      priorityWithdrawal: false,
      vipSupport: false,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      // No fixed earnings: what a member earns depends on available sponsored
      // budgets. Kept at 0 so nothing displays a guaranteed figure.
      estimatedDailyEarnings: 0,
      estimatedMonthlyEarnings: 0,
      estimatedYearlyEarnings: 0,
      estimatedROI: '',
    },
  },
  STARTER: {
    value: 'STARTER',
    label: 'Standard',
    emoji: '⭐',
    icon: 'Star',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Lots of tasks, better pay per task',
    features: ["Many daily tasks", "+30% reward per task", "Withdraw every day"],
    metadata: {
      maxDailyVideos: 24,
      maxDailyGames: 10,
      maxDailyAds: 24,
      maxDailySurveys: 5,
      // Reward per task = content reward x (1 + badgeBoost). Paid only from
      // real campaign budgets and the admin's daily reward budget.
      badgeBoost: 0.3,
      priorityWithdrawal: false,
      vipSupport: false,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      // No fixed earnings: what a member earns depends on available sponsored
      // budgets. Kept at 0 so nothing displays a guaranteed figure.
      estimatedDailyEarnings: 0,
      estimatedMonthlyEarnings: 0,
      estimatedYearlyEarnings: 0,
      estimatedROI: '',
    },
  },
  SILVER: {
    value: 'SILVER',
    label: 'Silver',
    emoji: '🥈',
    icon: 'Sparkles',
    color: '#94A3B8',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-700',
    badgeColor: 'bg-slate-200 text-slate-700',
    description: 'Fewer tasks, higher value',
    features: ["+80% reward per task", "Withdraw every day", "Priority payout review"],
    metadata: {
      maxDailyVideos: 18,
      maxDailyGames: 8,
      maxDailyAds: 18,
      maxDailySurveys: 4,
      // Reward per task = content reward x (1 + badgeBoost). Paid only from
      // real campaign budgets and the admin's daily reward budget.
      badgeBoost: 0.8,
      priorityWithdrawal: true,
      vipSupport: false,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      // No fixed earnings: what a member earns depends on available sponsored
      // budgets. Kept at 0 so nothing displays a guaranteed figure.
      estimatedDailyEarnings: 0,
      estimatedMonthlyEarnings: 0,
      estimatedYearlyEarnings: 0,
      estimatedROI: '',
    },
  },
  GOLD: {
    value: 'GOLD',
    label: 'Gold',
    emoji: '🥇',
    icon: 'Crown',
    color: '#D97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-800',
    badgeColor: 'bg-amber-200 text-amber-900',
    description: 'High-value tasks',
    features: ["2.5x reward per task", "Withdraw every day", "Priority support"],
    metadata: {
      maxDailyVideos: 12,
      maxDailyGames: 6,
      maxDailyAds: 12,
      maxDailySurveys: 3,
      // Reward per task = content reward x (1 + badgeBoost). Paid only from
      // real campaign budgets and the admin's daily reward budget.
      badgeBoost: 1.5,
      priorityWithdrawal: true,
      vipSupport: true,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      // No fixed earnings: what a member earns depends on available sponsored
      // budgets. Kept at 0 so nothing displays a guaranteed figure.
      estimatedDailyEarnings: 0,
      estimatedMonthlyEarnings: 0,
      estimatedYearlyEarnings: 0,
      estimatedROI: '',
    },
  },
  PLATINUM: {
    value: 'PLATINUM',
    label: 'Platinum',
    emoji: '💎',
    icon: 'Diamond',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-200 text-purple-800',
    description: 'Premium tasks, top rewards',
    features: ["3.5x reward per task", "Withdraw every day", "VIP support"],
    metadata: {
      maxDailyVideos: 8,
      maxDailyGames: 4,
      maxDailyAds: 8,
      maxDailySurveys: 3,
      // Reward per task = content reward x (1 + badgeBoost). Paid only from
      // real campaign budgets and the admin's daily reward budget.
      badgeBoost: 2.5,
      priorityWithdrawal: true,
      vipSupport: true,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      // No fixed earnings: what a member earns depends on available sponsored
      // budgets. Kept at 0 so nothing displays a guaranteed figure.
      estimatedDailyEarnings: 0,
      estimatedMonthlyEarnings: 0,
      estimatedYearlyEarnings: 0,
      estimatedROI: '',
    },
  },
  PREMIUM: {
    value: 'PREMIUM',
    label: 'Premium',
    emoji: '👑',
    icon: 'Crown',
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-700',
    badgeColor: 'bg-pink-200 text-pink-800',
    description: 'The highest reward per task',
    features: ["5x reward per task", "Withdraw every day", "VIP support"],
    metadata: {
      maxDailyVideos: 5,
      maxDailyGames: 3,
      maxDailyAds: 5,
      maxDailySurveys: 2,
      // Reward per task = content reward x (1 + badgeBoost). Paid only from
      // real campaign budgets and the admin's daily reward budget.
      badgeBoost: 4.0,
      priorityWithdrawal: true,
      vipSupport: true,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      // No fixed earnings: what a member earns depends on available sponsored
      // budgets. Kept at 0 so nothing displays a guaranteed figure.
      estimatedDailyEarnings: 0,
      estimatedMonthlyEarnings: 0,
      estimatedYearlyEarnings: 0,
      estimatedROI: '',
    },
  },
};

export const TIER_OPTIONS = Object.keys(TIERS);
export const TIER_LIST = Object.values(TIERS);

// Helper functions
export function getTierConfig(tier: string): TierConfig | undefined {
  return TIERS[tier];
}

export function getTierColor(tier: string): string {
  return TIERS[tier]?.color || '#6B7280';
}

export function getTierEmoji(tier: string): string {
  return TIERS[tier]?.emoji || '📋';
}

export function getTierLabel(tier: string): string {
  return TIERS[tier]?.label || tier;
}

export function getTierEarnings(tier: string): {
  daily: number;
  monthly: number;
  yearly: number;
} {
  const config = getTierConfig(tier);
  return {
    daily: config?.metadata.estimatedDailyEarnings || 0,
    monthly: config?.metadata.estimatedMonthlyEarnings || 0,
    yearly: config?.metadata.estimatedYearlyEarnings || 0,
  };
}

export function getTierFeatures(tier: string): string[] {
  return TIERS[tier]?.features || [];
}

export function isPremiumTier(tier: string): boolean {
  return ['GOLD', 'PLATINUM', 'PREMIUM'].includes(tier);
}

export function hasContentCreation(tier: string): boolean {
  return TIERS[tier]?.metadata.canCreateContent || false;
}

export function getRevenueShare(tier: string): number {
  return TIERS[tier]?.metadata.revenueShare || 0;
}

// ─── Plan display helpers (added; prices mirror the seed price map) ─────────

/** Display order, cheapest first. */
export const TIER_ORDER = [
  'FREE',
  'BASIC',
  'STARTER',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'PREMIUM',
] as const;

/**
 * Fallback prices (RWF) used only when the plans API returns nothing.
 * Must match src/lib/db/seeds/gamification/badges-subscriptions.seed.ts.
 */
export const TIER_PRICES: Record<string, { monthly: number; yearly: number }> =
  {
    FREE: { monthly: 0, yearly: 0 },
    BASIC: { monthly: 3000, yearly: 30000 },
    STARTER: { monthly: 6000, yearly: 60000 },
    SILVER: { monthly: 15000, yearly: 150000 },
    GOLD: { monthly: 30000, yearly: 300000 },
    PLATINUM: { monthly: 60000, yearly: 600000 },
    PREMIUM: { monthly: 120000, yearly: 1200000 },
  };

/** The plan we nudge people towards. */
export const RECOMMENDED_TIER = 'SILVER';
