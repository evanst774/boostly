// src/components/landing/Plans.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  CheckCircle2,
  Sparkles,
  Crown,
  Star,
  Loader2,
  TrendingUp,
  Users,
  Rocket,
  Gem,
} from 'lucide-react';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

// Animation variants
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

const featureVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

// Plan icons mapping
const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <Users className="w-5 h-5 text-gray-400" />,
  STARTER: <Star className="w-5 h-5 text-gold" />,
  SILVER: <Sparkles className="w-5 h-5 text-gray-400" />,
  GOLD: <Crown className="w-5 h-5 text-gold" />,
  PLATINUM: <Gem className="w-5 h-5 text-purple-400" />,
  PREMIUM: <Rocket className="w-5 h-5 text-pink-500" />,
};

// Plan colors mapping
const PLAN_COLORS: Record<
  string,
  { btnColor: string; borderColor: string; bgColor: string }
> = {
  FREE: {
    btnColor: 'bg-gray-500 hover:bg-gray-600 text-white',
    borderColor: 'border-gray-300',
    bgColor: 'bg-gray-50',
  },
  STARTER: {
    btnColor: 'bg-gold hover:bg-gold-hover text-navy',
    borderColor: 'border-gold',
    bgColor: 'bg-amber-50',
  },
  SILVER: {
    btnColor: 'bg-primary hover:bg-primary-hover text-white',
    borderColor: 'border-primary',
    bgColor: 'bg-slate-50',
  },
  GOLD: {
    btnColor: 'bg-gold hover:bg-gold-hover text-navy',
    borderColor: 'border-gold',
    bgColor: 'bg-amber-50',
  },
  PLATINUM: {
    btnColor: 'bg-purple-500 hover:bg-purple-600 text-white',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
  },
  PREMIUM: {
    btnColor: 'bg-pink-500 hover:bg-pink-600 text-white',
    borderColor: 'border-pink-500',
    bgColor: 'bg-pink-50',
  },
};

// Earning ranges per tier (min/max based on engagement)
const EARNING_RANGES: Record<string, { min: number; max: number }> = {
  FREE: { min: 2000, max: 5000 },
  STARTER: { min: 10000, max: 20000 },
  SILVER: { min: 25000, max: 50000 },
  GOLD: { min: 50000, max: 100000 },
  PLATINUM: { min: 100000, max: 250000 },
  PREMIUM: { min: 200000, max: 500000 },
};

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  dailyEarnings: number;
  features: string[];
  maxDailyVideos: number;
  maxDailyGames: number;
  maxDailyAds: number;
  maxDailySurveys: number;
  badgeBoost: number;
  priorityWithdrawal: boolean;
  vipSupport: boolean;
  isActive: boolean;
  popular?: boolean;
  best?: boolean;
  canCreateContent?: boolean;
  canMonetize?: boolean;
  revenueShare?: number;
}

export function Plans() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatAmount } = useSystemCurrency();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      const data = await response.json();

      const mappedPlans =
        data.plans?.map((plan: SubscriptionPlan) => ({
          ...plan,
          popular: plan.tier === 'GOLD',
          best: plan.tier === 'PLATINUM',
          features: plan.features || [],
        })) || [];

      setPlans(mappedPlans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load plans. Please try again later.');
      setPlans(getDefaultPlans());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultPlans = (): SubscriptionPlan[] => {
    return [
      {
        id: 'free',
        name: 'Free',
        tier: 'FREE',
        description: 'Basic access to earn rewards',
        priceMonthly: 0,
        priceYearly: 0,
        dailyEarnings: 30,
        features: [
          'Watch videos & earn',
          'Play games & earn',
          'Complete surveys',
          'Daily rewards',
          'Referral program',
        ],
        maxDailyVideos: 5,
        maxDailyGames: 3,
        maxDailyAds: 5,
        maxDailySurveys: 2,
        badgeBoost: 0,
        priorityWithdrawal: false,
        vipSupport: false,
        isActive: true,
        popular: false,
        best: false,
        canCreateContent: false,
        canMonetize: false,
        revenueShare: 0,
      },
      {
        id: 'starter',
        name: 'Starter',
        tier: 'STARTER',
        description: 'Start earning with more opportunities',
        priceMonthly: 6000,
        priceYearly: 60000,
        dailyEarnings: 80,
        features: [
          'Double earning limits',
          'Priority access to premium content',
          'Ad-free experience',
          'Exclusive games & surveys',
          'Basic analytics',
        ],
        maxDailyVideos: 15,
        maxDailyGames: 8,
        maxDailyAds: 15,
        maxDailySurveys: 5,
        badgeBoost: 0.15,
        priorityWithdrawal: false,
        vipSupport: false,
        isActive: true,
        popular: false,
        best: false,
        canCreateContent: false,
        canMonetize: false,
        revenueShare: 0,
      },
      {
        id: 'silver',
        name: 'Silver',
        tier: 'SILVER',
        description: 'Serious earners get serious rewards',
        priceMonthly: 15000,
        priceYearly: 150000,
        dailyEarnings: 220,
        features: [
          'Triple earning limits',
          'Priority withdrawals',
          'Exclusive content library',
          'Premium support',
          'Advanced analytics',
          'Content creation tools',
        ],
        maxDailyVideos: 30,
        maxDailyGames: 15,
        maxDailyAds: 30,
        maxDailySurveys: 10,
        badgeBoost: 0.3,
        priorityWithdrawal: true,
        vipSupport: false,
        isActive: true,
        popular: false,
        best: false,
        canCreateContent: true,
        canMonetize: false,
        revenueShare: 0,
      },
      {
        id: 'gold',
        name: 'Gold',
        tier: 'GOLD',
        description: 'Best value for creators & earners',
        priceMonthly: 30000,
        priceYearly: 300000,
        dailyEarnings: 500,
        features: [
          'Premium earning opportunities',
          'VIP support',
          'Content monetization',
          'Revenue sharing',
          'Early access to new features',
          'Verified badge',
          'Creator dashboard',
        ],
        maxDailyVideos: 50,
        maxDailyGames: 25,
        maxDailyAds: 50,
        maxDailySurveys: 15,
        badgeBoost: 0.3,
        priorityWithdrawal: true,
        vipSupport: true,
        isActive: true,
        popular: true,
        best: false,
        canCreateContent: true,
        canMonetize: true,
        revenueShare: 70,
      },
      {
        id: 'platinum',
        name: 'Platinum',
        tier: 'PLATINUM',
        description: 'Maximum potential for top earners',
        priceMonthly: 60000,
        priceYearly: 600000,
        dailyEarnings: 1100,
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
        maxDailyVideos: 100,
        maxDailyGames: 50,
        maxDailyAds: 100,
        maxDailySurveys: 25,
        badgeBoost: 0.3,
        priorityWithdrawal: true,
        vipSupport: true,
        isActive: true,
        popular: false,
        best: true,
        canCreateContent: true,
        canMonetize: true,
        revenueShare: 80,
      },
      {
        id: 'premium',
        name: 'Premium',
        tier: 'PREMIUM',
        description: 'The ultimate creator & earner experience',
        priceMonthly: 120000,
        priceYearly: 1200000,
        dailyEarnings: 2000,
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
        maxDailyVideos: 200,
        maxDailyGames: 100,
        maxDailyAds: 200,
        maxDailySurveys: 50,
        badgeBoost: 0.5,
        priorityWithdrawal: true,
        vipSupport: true,
        isActive: true,
        popular: false,
        best: false,
        canCreateContent: true,
        canMonetize: true,
        revenueShare: 85,
      },
    ];
  };

  const getEarningRange = (tier: string) => {
    return EARNING_RANGES[tier] || EARNING_RANGES.FREE;
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-bg" id="plans">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gold" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-bg" id="plans">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center py-12">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchPlans}
              className="mt-4 text-gold font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={sectionVariants}
      className="py-20 bg-bg"
      id="plans"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Left intro */}
          <div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-gold text-xs font-bold tracking-widest uppercase mb-2"
            >
              Choose Your Plan
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-3xl font-black text-navy mb-4"
            >
              Membership Plans
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-text-secondary text-sm mb-6"
            >
              Unlock higher earning limits, exclusive benefits and faster
              payouts with Boostly Premium.
            </motion.p>
            <motion.ul
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="space-y-2 mb-6"
            >
              {[
                'Higher daily earning limits',
                'Priority withdrawals',
                'Exclusive bonuses',
                'Ad-free experience',
              ].map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                  className="flex items-center gap-2 text-sm text-text-secondary"
                >
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                  {f}
                </motion.li>
              ))}
            </motion.ul>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.4 }}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gold hover:bg-gold-hover text-navy font-bold px-5 py-2.5 rounded-full text-sm transition-all duration-200 shadow-gold hover:shadow-gold/50"
            >
              View All Features
            </motion.button>
          </div>

          {/* Plans grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, i) => {
              const isHovered = hoveredPlan === plan.id;
              const icon = PLAN_ICONS[plan.tier] || (
                <Star className="w-5 h-5 text-gold" />
              );
              const colors = PLAN_COLORS[plan.tier] || PLAN_COLORS.STARTER;
              const earningRange = getEarningRange(plan.tier);
              const isFree = plan.tier === 'FREE';

              return (
                <motion.div
                  key={plan.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  variants={cardVariants}
                  whileHover="hover"
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  className={`relative bg-white rounded-2xl border-2 p-5 shadow-sm transition-all duration-300 ${
                    plan.best
                      ? 'border-purple-500 shadow-xl shadow-purple-500/10'
                      : plan.popular
                        ? 'border-gold shadow-xl shadow-gold/20'
                        : 'border-border hover:border-primary/30'
                  } ${isHovered ? 'shadow-2xl' : ''}`}
                >
                  {/* Badge */}
                  {plan.best && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/30 whitespace-nowrap"
                    >
                      ⭐ BEST VALUE
                    </motion.span>
                  )}

                  {plan.popular && !plan.best && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-gold/30 whitespace-nowrap"
                    >
                      🔥 MOST POPULAR
                    </motion.span>
                  )}

                  {/* Plan Icon */}
                  <motion.div
                    className="w-10 h-10 rounded-full bg-bg flex items-center justify-center mb-3"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {icon}
                  </motion.div>

                  {/* Plan Name */}
                  <p className="font-bold text-navy text-base mb-0.5">
                    {plan.name}
                  </p>

                  {/* Description */}
                  <p className="text-[11px] text-text-muted mb-3">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-3">
                    {isFree ? (
                      <p className="text-2xl font-black text-navy tracking-tight">
                        Free
                      </p>
                    ) : (
                      <>
                        <p className="text-2xl font-black text-navy tracking-tight">
                          {formatAmount(plan.priceMonthly)}
                        </p>
                        <p className="text-[10px] text-text-muted">per month</p>
                      </>
                    )}
                  </div>

                  {/* Earning Range - NEW */}
                  {!isFree && (
                    <div className="mb-4 p-3 rounded-xl bg-bg border border-border">
                      <div className="flex items-center gap-2 text-[10px] text-text-muted mb-1">
                        <TrendingUp size={12} className="text-gold" />
                        <span>Estimated Monthly Earnings</span>
                      </div>
                      <p className="text-sm font-bold text-navy">
                        {formatAmount(earningRange.min)} –{' '}
                        {formatAmount(earningRange.max)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Based on average user engagement
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <motion.ul className="space-y-1.5 mb-4">
                    {plan.features.slice(0, 4).map((f, idx) => (
                      <motion.li
                        key={f}
                        custom={idx}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={featureVariants}
                        className="flex items-start gap-1.5 text-[11px] text-text-secondary"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </motion.li>
                    ))}
                    {plan.features.length > 4 && (
                      <motion.li
                        custom={4}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={featureVariants}
                        className="flex items-start gap-1.5 text-[11px] text-text-secondary"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="leading-tight text-text-muted">
                          +{plan.features.length - 4} more features
                        </span>
                      </motion.li>
                    )}
                  </motion.ul>

                  {/* Revenue Share Badge */}
                  {plan.revenueShare && plan.revenueShare > 0 && (
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        {plan.revenueShare}% Revenue Share
                      </span>
                      {plan.canCreateContent && (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          🎬 Creator
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-xs font-bold py-2.5 rounded-full transition-all duration-200 ${colors.btnColor} ${
                      isHovered ? 'shadow-lg' : ''
                    }`}
                  >
                    {isFree ? 'Get Started' : 'Subscribe Now'}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
