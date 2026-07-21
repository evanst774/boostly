// src/app/(dashboard)/badges/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';
import {
  useBadges,
  type BadgeTier,
} from '@/hooks/useBadges';
import { cn, formatCurrency } from '@/lib/utils';
import { type SubscriptionPlan } from '@/lib/db/schema';

type SubscriptionTier = 'starter' | 'silver' | 'gold' | 'platinum';

interface BadgeCardData {
  tier: BadgeTier;
  name: string;
  emoji: string;
  boost: string;
  price: number;
  oneTimeReward: number;
  color: string;
  bgColor: string;
  borderColor: string;
  features: string[];
}

// Fallback data only used when API fails
const FALLBACK_BADGE_DATA: Record<BadgeTier, BadgeCardData> = {
  SILVER: {
    tier: 'SILVER',
    name: 'Silver Badge',
    emoji: '🥈',
    boost: '+15%',
    price: 5000,
    oneTimeReward: 5000,
    color: 'from-[#94A3B8] to-[#64748B]',
    bgColor: 'bg-[#F8FAFC]',
    borderColor: 'border-[#94A3B8]',
    features: ['+15% earnings boost', 'Priority support'],
  },
  GOLD: {
    tier: 'GOLD',
    name: 'Gold Badge',
    emoji: '🥇',
    boost: '+30%',
    price: 10000,
    oneTimeReward: 10000,
    color: 'from-[#F59E0B] to-[#D97706]',
    bgColor: 'bg-[#FFFBEB]',
    borderColor: 'border-[#F59E0B]',
    features: ['+30% earnings boost', 'VIP support', 'Exclusive games'],
  },
  PLATINUM: {
    tier: 'PLATINUM',
    name: 'Platinum Badge',
    emoji: '💎',
    boost: '+30%',
    price: 20000,
    oneTimeReward: 20000,
    color: 'from-[#8B5CF6] to-[#6D28D9]',
    bgColor: 'bg-[#F5F3FF]',
    borderColor: 'border-[#8B5CF6]',
    features: [
      '+30% earnings boost',
      'Premium VIP support',
      'Exclusive games',
      'Faster withdrawals',
    ],
  },
};

const FALLBACK_SUBSCRIPTION_PLANS: Array<{
  tier: SubscriptionTier;
  name: string;
  emoji: string;
  dailyEarnings: number;
  monthlyEarnings: number;
  price: number;
  yearlyPrice: number;
  features: string[];
  popular: boolean;
  color: string;
  bgColor: string;
}> = [
  {
    tier: 'starter',
    name: 'Starter Plan',
    emoji: '🥇',
    dailyEarnings: 80,
    monthlyEarnings: 2400,
    price: 6000,
    yearlyPrice: 60000,
    features: [
      'Watch videos & ads',
      'Play games',
      'Daily rewards',
      'Referrals',
      '+15% badge boost',
    ],
    popular: true,
    color: 'from-[#F59E0B] to-[#D97706]',
    bgColor: 'bg-[#FFFBEB]',
  },
  {
    tier: 'silver',
    name: 'Silver Plan',
    emoji: '🥈',
    dailyEarnings: 220,
    monthlyEarnings: 6600,
    price: 15000,
    yearlyPrice: 150000,
    features: [
      'Everything in Starter',
      '+30% badge boost',
      'Priority withdrawals',
      'Higher earnings limits',
      'Exclusive games',
    ],
    popular: false,
    color: 'from-[#2563EB] to-[#1D4ED8]',
    bgColor: 'bg-[#EFF6FF]',
  },
  {
    tier: 'gold',
    name: 'Gold Plan',
    emoji: '🏆',
    dailyEarnings: 500,
    monthlyEarnings: 15000,
    price: 30000,
    yearlyPrice: 300000,
    features: [
      'Everything in Silver',
      '+30% badge boost',
      'VIP support',
      'Premium games',
      'Monthly bonus',
      'Faster payouts',
    ],
    popular: false,
    color: 'from-[#F59E0B] to-[#D97706]',
    bgColor: 'bg-[#FFFBEB]',
  },
  {
    tier: 'platinum',
    name: 'Platinum Plan',
    emoji: '💎',
    dailyEarnings: 1100,
    monthlyEarnings: 33000,
    price: 60000,
    yearlyPrice: 600000,
    features: [
      'Everything in Gold',
      '+30% badge boost',
      'Premium VIP support',
      'Exclusive games & content',
      'Priority payouts',
      'VIP badge',
      'Premium ad campaigns',
    ],
    popular: false,
    color: 'from-[#8B5CF6] to-[#6D28D9]',
    bgColor: 'bg-[#F5F3FF]',
  },
];

export default function BadgesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'badges' | 'subscriptions'>(
    'badges',
  );
  const [selectedBadge, setSelectedBadge] = useState<BadgeTier>('GOLD');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('starter');
  const [isBuying, setIsBuying] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [billingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const { data, isLoading, refetch } = useBadges();
  const activeBadge = data?.activeBadge || null;
  const userSubscription = data?.subscription || null;
  const allBadges = data?.allBadges || [];
  const allPlans = data?.allPlans || [];

  // Build badge data from API or fallback
  const badgeData =
    allBadges.length > 0
      ? allBadges.reduce(
          (acc, badge) => {
            const tier = badge.tier as BadgeTier;
            acc[tier] = {
              tier,
              name: badge.name,
              emoji: badge.icon || getDefaultEmoji(tier),
              boost: `+${Math.round(badge.earningsBoost * 100)}%`,
              price: badge.price,
              oneTimeReward: badge.oneTimeReward,
              color: badge.color || getDefaultColor(tier),
              bgColor: getDefaultBgColor(tier),
              borderColor: getDefaultBorderColor(tier),
              features: badge.features || [],
            };
            return acc;
          },
          {} as Record<BadgeTier, BadgeCardData>,
        )
      : FALLBACK_BADGE_DATA;

  // Build subscription plans from API or fallback
  const subscriptionPlans =
    allPlans.length > 0
      ? allPlans.map((plan: SubscriptionPlan) => {
          const tier = plan.tier.toLowerCase() as SubscriptionTier;
          return {
            tier,
            name: plan.name,
            emoji: getPlanEmoji(tier),
            dailyEarnings: plan.dailyEarnings,
            monthlyEarnings: plan.dailyEarnings * 30,
            price: plan.priceMonthly,
            yearlyPrice: plan.priceYearly || plan.priceMonthly * 12,
            features: plan.features || [],
            popular: tier === 'starter',
            color: getPlanColor(tier),
            bgColor: getPlanBgColor(tier),
          };
        })
      : FALLBACK_SUBSCRIPTION_PLANS;

  // Helper functions for defaults
  function getDefaultEmoji(tier: BadgeTier): string {
    const map = { SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎' };
    return map[tier];
  }

  function getDefaultColor(tier: BadgeTier): string {
    const map = {
      SILVER: 'from-[#94A3B8] to-[#64748B]',
      GOLD: 'from-[#F59E0B] to-[#D97706]',
      PLATINUM: 'from-[#8B5CF6] to-[#6D28D9]',
    };
    return map[tier];
  }

  function getDefaultBgColor(tier: BadgeTier): string {
    const map = {
      SILVER: 'bg-[#F8FAFC]',
      GOLD: 'bg-[#FFFBEB]',
      PLATINUM: 'bg-[#F5F3FF]',
    };
    return map[tier];
  }

  function getDefaultBorderColor(tier: BadgeTier): string {
    const map = {
      SILVER: 'border-[#94A3B8]',
      GOLD: 'border-[#F59E0B]',
      PLATINUM: 'border-[#8B5CF6]',
    };
    return map[tier];
  }

  function getPlanEmoji(tier: SubscriptionTier): string {
    const map = {
      starter: '🥇',
      silver: '🥈',
      gold: '🏆',
      platinum: '💎',
    };
    return map[tier];
  }

  function getPlanColor(tier: SubscriptionTier): string {
    const map = {
      starter: 'from-[#F59E0B] to-[#D97706]',
      silver: 'from-[#2563EB] to-[#1D4ED8]',
      gold: 'from-[#F59E0B] to-[#D97706]',
      platinum: 'from-[#8B5CF6] to-[#6D28D9]',
    };
    return map[tier];
  }

  function getPlanBgColor(tier: SubscriptionTier): string {
    const map = {
      starter: 'bg-[#FFFBEB]',
      silver: 'bg-[#EFF6FF]',
      gold: 'bg-[#FFFBEB]',
      platinum: 'bg-[#F5F3FF]',
    };
    return map[tier];
  }

  const handlePurchaseBadge = (tier: BadgeTier) => {
    setSelectedBadge(tier);
    setShowCheckout(true);
  };

  const handleConfirmPurchase = async () => {
    setIsBuying(true);
    try {
      const response = await fetch('/api/badges/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId: selectedBadge }),
      });

      if (!response.ok) throw new Error('Failed to purchase badge');

      setShowCheckout(false);
      setShowSuccess(true);
      await refetch(); // Refresh data after purchase
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      alert('Failed to purchase badge. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  const handleSubscribe = (tier: SubscriptionTier) => {
    setSelectedPlan(tier);
    setShowCheckout(true);
  };

  const handleConfirmSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const response = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle: billingCycle,
        }),
      });

      if (!response.ok) throw new Error('Failed to subscribe');

      setShowCheckout(false);
      setShowSuccess(true);
      await refetch(); // Refresh data after subscription
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      alert('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      alert('Subscription cancelled successfully');
      await refetch(); // Refresh data after cancellation
    } catch {
      alert('Failed to cancel subscription. Please try again.');
    }
  };


  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 border-4 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-[#6B7280]">Loading badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-xl border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Badges & Subscriptions</h1>
          <p className="text-sm text-[#6B7280]">
            Boost your earnings with badges and plans
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F8FAFC] rounded-2xl p-1 border border-[#F3F4F6]">
        {[
          { id: 'badges', label: '🏅 Badges' },
          { id: 'subscriptions', label: '📋 Subscriptions' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]',
            )}
            onClick={() => setActiveTab(tab.id as 'badges' | 'subscriptions')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* Active Badge */}
          {activeBadge && (
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl p-6 text-white',
                activeBadge.badge.tier === 'SILVER'
                  ? 'bg-gradient-to-br from-[#64748B] to-[#94A3B8]'
                  : activeBadge.badge.tier === 'GOLD'
                    ? 'bg-gradient-to-br from-[#92400E] to-[#F59E0B]'
                    : 'bg-gradient-to-br from-[#4C1D95] to-[#8B5CF6]',
              )}
            >
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5" />

              <div className="relative z-10 flex items-center gap-4">
                <span className="text-5xl drop-shadow-lg">
                  {activeBadge.badge.tier === 'SILVER'
                    ? '🥈'
                    : activeBadge.badge.tier === 'GOLD'
                      ? '🥇'
                      : '💎'}
                </span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {activeBadge.badge.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    Member since{' '}
                    {new Date(activeBadge.purchasedAt).toLocaleDateString()}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1 rounded-full mt-2">
                    ● Active
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Total Earned</p>
                  <p className="text-2xl font-extrabold">Rwf 15,750</p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Prompt */}
          {activeBadge && activeBadge.badge.tier !== 'PLATINUM' && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 flex items-center gap-4">
              <span className="text-4xl">💎</span>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-[#2563EB]">
                  Upgrade to Platinum
                </h4>
                <p className="text-sm text-[#6B7280]">
                  Get VIP support + max earnings boost
                </p>
              </div>
              <button
                className="bg-[#2563EB] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#1D4ED8] transition-colors"
                onClick={() => handlePurchaseBadge('PLATINUM')}
              >
                Upgrade
              </button>
            </div>
          )}

          {/* Badge Options */}
          <h3 className="text-sm font-bold">Choose Your Badge</h3>
          <p className="text-sm text-[#6B7280] -mt-2">
            One-time payment • Lifetime access
          </p>

          <div className="space-y-4">
            {Object.entries(badgeData).map(([tier, badge]) => {
              const tierKey = tier as BadgeTier;
              const isActive = activeBadge?.badge.tier === tierKey;
              const isSelected = selectedBadge === tierKey;

              return (
                <div
                  key={tier}
                  className={cn(
                    'rounded-2xl border-2 p-5 transition-all cursor-pointer',
                    isActive || isSelected
                      ? `${badge.borderColor} ${badge.bgColor} shadow-md scale-[1.02]`
                      : 'border-[#F3F4F6] hover:shadow-md hover:-translate-y-0.5',
                  )}
                  onClick={() => setSelectedBadge(tierKey)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-5xl drop-shadow-md">
                      {badge.emoji}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold">{badge.name}</h4>
                        {isActive && (
                          <span className="text-xs font-bold text-[#22C55E] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                        {tier === 'GOLD' && !isActive && (
                          <span className="text-[10px] font-bold bg-[#2563EB] text-white px-2 py-0.5 rounded-full">
                            ⭐ Most Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6B7280]">
                        {badge.boost} monthly earnings boost
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span
                          className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded-full',
                            tier === 'SILVER'
                              ? 'bg-[#F8FAFC] text-[#64748B]'
                              : tier === 'GOLD'
                                ? 'bg-[#FFFBEB] text-[#92400E]'
                                : 'bg-[#F5F3FF] text-[#6D28D9]',
                          )}
                        >
                          {formatCurrency(badge.price)}
                        </span>
                        <span className="text-xs font-bold text-[#22C55E] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                          {badge.boost} boost
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-[#22C55E]">
                        {badge.boost}
                      </p>
                      {!isActive && (
                        <button
                          className="mt-2 bg-[#2563EB] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#1D4ED8] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseBadge(tierKey);
                          }}
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Active Subscription */}
          {userSubscription && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] p-6 text-white">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center text-3xl">
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {userSubscription.plan?.name || 'Pro Plan'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                    <span className="text-xs text-white/60">
                      Next billing:{' '}
                      {userSubscription.expiresAt
                        ? new Date(
                            userSubscription.expiresAt,
                          ).toLocaleDateString()
                        : 'Jun 16, 2025'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">Daily Earnings</p>
                  <p className="text-2xl font-extrabold">
                    ~
                    {formatCurrency(
                      userSubscription.plan?.dailyEarnings || 500,
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Plans */}
          <h3 className="text-sm font-bold">Choose Your Plan</h3>
          <p className="text-sm text-[#6B7280] -mt-2">
            Subscribe to a plan and start earning every day
          </p>

          <div className="space-y-4">
            {subscriptionPlans.map((plan) => {
              const isActive = userSubscription?.plan?.tier === plan.tier;
              const price =
                billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;

              return (
                <div
                  key={plan.tier}
                  className={cn(
                    'rounded-2xl border-2 p-5 transition-all',
                    isActive
                      ? `${plan.bgColor} border-[#22C55E] shadow-md`
                      : selectedPlan === plan.tier
                        ? `${plan.bgColor} ${plan.tier === 'starter' ? 'border-[#D97706]' : ''} shadow-md scale-[1.02]`
                        : 'border-[#F3F4F6] hover:shadow-md hover:-translate-y-0.5',
                  )}
                  onClick={() => setSelectedPlan(plan.tier)}
                >
                  {plan.popular && (
                    <div className="flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-3 py-1 rounded-full mb-3">
                      🔥 MOST POPULAR
                    </div>
                  )}
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{plan.emoji}</span>
                        <div>
                          <h4 className="text-lg font-bold">{plan.name}</h4>
                          <p className="text-sm text-[#6B7280]">
                            {plan.dailyEarnings} RWF / day
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {plan.features.slice(0, 4).map((feature, i) => (
                          <span
                            key={i}
                            className="text-xs text-[#6B7280] bg-[#F8FAFC] px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <Check size={10} className="text-[#22C55E]" />
                            {feature}
                          </span>
                        ))}
                        {plan.features.length > 4 && (
                          <span className="text-xs text-[#6B7280] bg-[#F8FAFC] px-2 py-0.5 rounded-full">
                            +{plan.features.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-[#6B7280]">Price</p>
                      <p className="text-2xl font-extrabold">
                        {formatCurrency(price)}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        per {billingCycle === 'monthly' ? 'month' : 'year'}
                      </p>
                      {!isActive && (
                        <button
                          className="mt-3 w-full bg-[#2563EB] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#1D4ED8] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubscribe(plan.tier);
                          }}
                        >
                          Subscribe Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Bar */}
          <div className="grid grid-cols-3 gap-4 bg-white rounded-2xl border border-[#F3F4F6] p-4">
            {[
              {
                icon: '📅',
                title: 'Daily Earnings',
                desc: 'Earn cash every day by completing tasks',
              },
              {
                icon: '💳',
                title: 'Monthly Payout',
                desc: 'Get your earnings monthly (1st–5th)',
              },
              {
                icon: '🛡️',
                title: '100% Secure',
                desc: 'Safe payments via trusted partners',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-2 text-lg">
                  {item.icon}
                </div>
                <p className="text-xs font-bold">{item.title}</p>
                <p className="text-[10px] text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Cancel Subscription */}
          {userSubscription && (
            <button
              className="w-full py-3 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-bold hover:bg-[#FEF2F2] transition-colors"
              onClick={handleCancelSubscription}
            >
              Cancel Subscription
            </button>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {activeTab === 'badges'
                  ? 'Purchase Badge'
                  : 'Subscribe to Plan'}
              </h3>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-center">
                <span className="text-6xl">
                  {activeTab === 'badges'
                    ? badgeData[selectedBadge]?.emoji || '🏅'
                    : subscriptionPlans.find((p) => p.tier === selectedPlan)
                        ?.emoji || '📋'}
                </span>
                <h4 className="text-xl font-bold mt-2">
                  {activeTab === 'badges'
                    ? badgeData[selectedBadge]?.name || 'Badge'
                    : subscriptionPlans.find((p) => p.tier === selectedPlan)
                        ?.name || 'Plan'}
                </h4>
                <p className="text-sm text-[#6B7280]">
                  {activeTab === 'badges'
                    ? `${badgeData[selectedBadge]?.boost || '+0%'} earnings boost`
                    : `${formatCurrency(
                        subscriptionPlans.find((p) => p.tier === selectedPlan)
                          ?.dailyEarnings || 0,
                      )} RWF / day`}
                </p>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Price</span>
                  <span className="font-bold">
                    {activeTab === 'badges'
                      ? formatCurrency(badgeData[selectedBadge]?.price || 0)
                      : formatCurrency(
                          billingCycle === 'monthly'
                            ? subscriptionPlans.find(
                                (p) => p.tier === selectedPlan,
                              )?.price || 0
                            : subscriptionPlans.find(
                                (p) => p.tier === selectedPlan,
                              )?.yearlyPrice || 0,
                        )}
                  </span>
                </div>
                {activeTab === 'badges' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">One-time reward</span>
                    <span className="font-bold text-[#22C55E]">
                      +
                      {formatCurrency(
                        badgeData[selectedBadge]?.oneTimeReward || 0,
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Payment method</span>
                  <span className="font-bold">💰 Wallet Balance</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#F3F4F6] flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors text-sm font-medium"
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-[#2563EB] text-white font-bold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2"
                onClick={
                  activeTab === 'badges'
                    ? handleConfirmPurchase
                    : handleConfirmSubscribe
                }
                disabled={isBuying || isSubscribing}
              >
                {isBuying || isSubscribing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-[#F0FDF4] border-4 border-[#22C55E] flex items-center justify-center text-4xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-xl font-bold">
              {activeTab === 'badges'
                ? 'Badge Purchased! 🎉'
                : 'Subscription Activated! 🎉'}
            </h3>
            <p className="text-[#6B7280] mt-2">
              {activeTab === 'badges'
                ? `${badgeData[selectedBadge]?.name || 'Badge'} activated! ${badgeData[selectedBadge]?.boost || '+0%'} earnings boost applied.`
                : `${subscriptionPlans.find((p) => p.tier === selectedPlan)?.name} activated! Start earning ${formatCurrency(subscriptionPlans.find((p) => p.tier === selectedPlan)?.dailyEarnings || 0)} RWF per day.`}
            </p>
            <button
              className="mt-6 w-full bg-[#2563EB] text-white font-bold py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors"
              onClick={() => setShowSuccess(false)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
