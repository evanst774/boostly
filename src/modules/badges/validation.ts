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
export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  tier: z.string().min(1),
  priceMonthly: z.number().positive(),
  priceYearly: z.number().positive().optional(),
  dailyEarnings: z.number().positive(),
  features: z.array(z.string()),
  maxDailyVideos: z.number().int().positive().default(10),
  maxDailyGames: z.number().int().positive().default(5),
  maxDailyAds: z.number().int().positive().default(10),
  maxDailySurveys: z.number().int().positive().default(3),
  badgeBoost: z.number().min(0).max(1).default(0),
  priorityWithdrawal: z.boolean().default(false),
  vipSupport: z.boolean().default(false),
});

export const updateSubscriptionPlanSchema =
  createSubscriptionPlanSchema.partial();

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
