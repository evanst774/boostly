// src/modules/rewards/validation.ts
import { z } from 'zod';
import { RewardTypeEnum } from '@/lib/db/schema';

// ============================================
// REWARD VALIDATION
// ============================================
export const createRewardSchema = z.object({
  userId: z.uuid().optional(),
  type: z.enum(RewardTypeEnum),
  amount: z.number().positive(),
  description: z.string().optional(),
  sourceId: z.string().optional(),
  sourceType: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const claimRewardSchema = z.object({
  rewardId: z.uuid(),
});

export const getRewardsFiltersSchema = z.object({
  type: z.enum(RewardTypeEnum).optional(),
  status: z.enum(['PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED']).optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type ClaimRewardInput = z.infer<typeof claimRewardSchema>;
export type GetRewardsFilters = z.infer<typeof getRewardsFiltersSchema>;

// ============================================
// DAILY BONUS VALIDATION
// ============================================
export const createDailyBonusSchema = z.object({
  userId: z.uuid(),
  streakDay: z.number().int().positive(),
  bonusAmount: z.number().positive(),
  date: z.date(),
  claimed: z.boolean().default(false),
});

export type CreateDailyBonusInput = z.infer<typeof createDailyBonusSchema>;

// ============================================
// AD WATCH VALIDATION
// ============================================
export const createAdWatchSchema = z.object({
  advertiser: z.string().min(1),
  rewardAmount: z.number().positive(),
});

export type CreateAdWatchInput = z.infer<typeof createAdWatchSchema>;
