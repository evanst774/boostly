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
    description: 'Basic access to earn rewards',
    features: [
      'Watch videos & earn',
      'Play games & earn',
      'Complete surveys',
      'Daily rewards',
      'Referral program',
    ],
    metadata: {
      maxDailyVideos: 5,
      maxDailyGames: 3,
      maxDailyAds: 5,
      maxDailySurveys: 2,
      badgeBoost: 0,
      priorityWithdrawal: false,
      vipSupport: false,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: false,
      customBadge: false,
      estimatedDailyEarnings: 30,
      estimatedMonthlyEarnings: 900,
      estimatedYearlyEarnings: 10950,
      estimatedROI: '100%',
    },
  },
  STARTER: {
    value: 'STARTER',
    label: 'Starter',
    emoji: '🌟',
    icon: 'Star',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Start earning with more opportunities',
    features: [
      'Double earning limits',
      'Priority access to premium content',
      'Ad-free experience',
      'Exclusive games & surveys',
      'Basic analytics',
    ],
    metadata: {
      maxDailyVideos: 15,
      maxDailyGames: 8,
      maxDailyAds: 15,
      maxDailySurveys: 5,
      badgeBoost: 0.15,
      priorityWithdrawal: false,
      vipSupport: false,
      canCreateContent: false,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      estimatedDailyEarnings: 80,
      estimatedMonthlyEarnings: 2400,
      estimatedYearlyEarnings: 29200,
      estimatedROI: '85%',
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
    description: 'Serious earners get serious rewards',
    features: [
      'Triple earning limits',
      'Priority withdrawals',
      'Exclusive content library',
      'Premium support',
      'Advanced analytics',
      'Content creation tools',
    ],
    metadata: {
      maxDailyVideos: 30,
      maxDailyGames: 15,
      maxDailyAds: 30,
      maxDailySurveys: 10,
      badgeBoost: 0.3,
      priorityWithdrawal: true,
      vipSupport: false,
      canCreateContent: true,
      canMonetize: false,
      revenueShare: 0,
      earlyAccess: false,
      analytics: true,
      customBadge: false,
      estimatedDailyEarnings: 220,
      estimatedMonthlyEarnings: 6600,
      estimatedYearlyEarnings: 80300,
      estimatedROI: '120%',
    },
  },
  GOLD: {
    value: 'GOLD',
    label: 'Gold',
    emoji: '🥇',
    icon: 'Crown',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-800',
    badgeColor: 'bg-amber-200 text-amber-900',
    description: 'Best value for creators & earners',
    features: [
      'Premium earning opportunities',
      'VIP support',
      'Content monetization',
      'Revenue sharing',
      'Early access to new features',
      'Verified badge',
      'Creator dashboard',
    ],
    metadata: {
      maxDailyVideos: 50,
      maxDailyGames: 25,
      maxDailyAds: 50,
      maxDailySurveys: 15,
      badgeBoost: 0.3,
      priorityWithdrawal: true,
      vipSupport: true,
      canCreateContent: true,
      canMonetize: true,
      revenueShare: 70,
      earlyAccess: true,
      analytics: true,
      customBadge: true,
      estimatedDailyEarnings: 500,
      estimatedMonthlyEarnings: 15000,
      estimatedYearlyEarnings: 182500,
      estimatedROI: '150%',
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
    description: 'Maximum potential for top earners',
    features: [
      'Unlimited earning potential',
      'Premium VIP support',
      'Higher revenue share',
      'Exclusive content & events',
      'Instant payouts',
      'Elite badge',
      'Personal account manager',
      'Creator fund access',
    ],
    metadata: {
      maxDailyVideos: 100,
      maxDailyGames: 50,
      maxDailyAds: 100,
      maxDailySurveys: 25,
      badgeBoost: 0.3,
      priorityWithdrawal: true,
      vipSupport: true,
      canCreateContent: true,
      canMonetize: true,
      revenueShare: 80,
      earlyAccess: true,
      analytics: true,
      customBadge: true,
      estimatedDailyEarnings: 1100,
      estimatedMonthlyEarnings: 33000,
      estimatedYearlyEarnings: 401500,
      estimatedROI: '180%',
    },
  },
  PREMIUM: {
    value: 'PREMIUM',
    label: 'Premium',
    emoji: '⭐',
    icon: 'Star',
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-700',
    badgeColor: 'bg-pink-200 text-pink-800',
    description: 'The ultimate creator & earner experience',
    features: [
      'Maximum earning potential',
      'Ultimate VIP support',
      'Highest revenue share',
      'All content unlocked',
      'Exclusive partnerships',
      'Premium elite badge',
      'Invite-only events',
      'Platform revenue share',
    ],
    metadata: {
      maxDailyVideos: 200,
      maxDailyGames: 100,
      maxDailyAds: 200,
      maxDailySurveys: 50,
      badgeBoost: 0.5,
      priorityWithdrawal: true,
      vipSupport: true,
      canCreateContent: true,
      canMonetize: true,
      revenueShare: 85,
      earlyAccess: true,
      analytics: true,
      customBadge: true,
      estimatedDailyEarnings: 2500,
      estimatedMonthlyEarnings: 75000,
      estimatedYearlyEarnings: 912500,
      estimatedROI: '200%',
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
