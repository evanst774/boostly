// src/modules/badges/validation.ts
import { z } from 'zod';
import { BADGE_TIER_LIST, type BadgeTier } from '@/lib/db/schema';

// ============================================
// BADGE VALIDATION
// ============================================
export const createBadgeSchema = z.object({
  tier: z.enum(BADGE_TIER_LIST as [BadgeTier, ...BadgeTier[]]),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  earningsBoost: z.number().min(0).max(1),
  oneTimeReward: z.number().positive(),
  price: z.number().positive(),
  features: z.array(z.string()),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateBadgeSchema = createBadgeSchema.partial();

export const purchaseBadgeSchema = z.object({
  badgeId: z.uuid(),
});

export type CreateBadgeInput = z.infer<typeof createBadgeSchema>;
export type UpdateBadgeInput = z.infer<typeof updateBadgeSchema>;
export type PurchaseBadgeInput = z.infer<typeof purchaseBadgeSchema>;

// ============================================
// SUBSCRIPTION PLAN VALIDATION
// ============================================
// Every plan field is admin-editable. 0 is valid for the Free plan's price
// and for "no daily maximum".
const planFields = {
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  /** Unique plan key, e.g. GOLD or STUDENT_PLUS. 'FREE' is the default plan. */
  tier: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]{1,31}$/, 'Use 2-32 letters, numbers or _ (e.g. GOLD_PLUS)'),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0).optional(),
  /** Most a member on this plan can earn from tasks per day (RWF). 0 = no maximum. */
  dailyEarnings: z.number().min(0).max(10_000_000),
  features: z.array(z.string()),
  maxDailyVideos: z.number().int().min(0).max(10_000),
  maxDailyGames: z.number().int().min(0).max(10_000),
  maxDailyAds: z.number().int().min(0).max(10_000),
  maxDailySurveys: z.number().int().min(0).max(10_000),
  /** Extra reward per task: 0.3 = +30%. */
  badgeBoost: z.number().min(0).max(5),
  priorityWithdrawal: z.boolean(),
  vipSupport: z.boolean(),
  /** Days between withdrawals (1 = daily, 7 = weekly). Null = plan default. */
  withdrawalIntervalDays: z.number().int().min(1).max(90).nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000).nullable(),
  isPopular: z.boolean().nullable(),
};

export const createSubscriptionPlanSchema = z.object({
  ...planFields,
  maxDailyVideos: planFields.maxDailyVideos.default(10),
  maxDailyGames: planFields.maxDailyGames.default(5),
  maxDailyAds: planFields.maxDailyAds.default(10),
  maxDailySurveys: planFields.maxDailySurveys.default(3),
  badgeBoost: planFields.badgeBoost.default(0),
  priorityWithdrawal: planFields.priorityWithdrawal.default(false),
  vipSupport: planFields.vipSupport.default(false),
  withdrawalIntervalDays: planFields.withdrawalIntervalDays.optional(),
  isActive: planFields.isActive.default(true),
  sortOrder: planFields.sortOrder.optional(),
  isPopular: planFields.isPopular.optional(),
});

// No defaults here: a PATCH must only change the fields it sends.
export const updateSubscriptionPlanSchema = z.object(planFields).partial();

export const subscribeToPlanSchema = z.object({
  planId: z.uuid(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  autoRenew: z.boolean().default(false),
});

export type CreateSubscriptionPlanInput = z.infer<
  typeof createSubscriptionPlanSchema
>;
export type UpdateSubscriptionPlanInput = z.infer<
  typeof updateSubscriptionPlanSchema
>;
export type SubscribeToPlanInput = z.infer<typeof subscribeToPlanSchema>;
