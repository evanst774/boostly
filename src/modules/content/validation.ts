// src/modules/content/validation.ts
import { z } from 'zod';
import {
  VideoCategoryEnum,
  GameCategoryEnum,
  GameOrientationEnum,
  GameProviderEnum,
  SurveyCategoryEnum,
} from '@/lib/db/schema';

// ============================================
// REUSABLE SPONSOR VALIDATION
// ============================================

/**
 * Zod 4 check function for sponsored content validation
 * Reused across all content types (Video, Game, Survey)
 */
export function validateSponsoredContent({
  value,
  issues,
}: z.core.ParsePayload<{
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorWebsite?: string;
}>) {
  if (!value.isSponsored) return;

  // Validate sponsor name
  if (!value.sponsorName?.trim()) {
    issues.push({
      code: 'custom',
      path: ['sponsorName'],
      message: 'Sponsor name is required for sponsored content',
      input: value.sponsorName,
    });
  }

  // Validate sponsor website
  if (!value.sponsorWebsite?.trim()) {
    issues.push({
      code: 'custom',
      path: ['sponsorWebsite'],
      message: 'Sponsor website is required for sponsored content',
      input: value.sponsorWebsite,
    });
  }
}

// ============================================
// VIDEO VALIDATION
// ============================================

const videoBaseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(VideoCategoryEnum),
  difficulty: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .optional(),
  duration: z.number().int().positive().optional(),
  videoUrl: z.url('Invalid video URL format'),
  thumbnailUrl: z.url('Invalid thumbnail URL format').optional(),
  videoKey: z.string().optional(),
  thumbnailKey: z.string().optional(),
  rewardAmount: z.number().positive().default(40),
  bonusReward: z.number().positive().optional(),
  isSponsored: z.boolean().default(false),
  sponsorName: z.string().optional(),
  sponsorLogo: z.url('Invalid sponsor logo URL format').optional(),
  sponsorWebsite: z.url('Invalid sponsor website URL format').optional(),
  sponsoredUntil: z.iso.datetime().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE']).default('DRAFT'),
});

export const createVideoSchema = videoBaseSchema.check(
  validateSponsoredContent,
);
export const updateVideoSchema = videoBaseSchema
  .partial()
  .check(validateSponsoredContent);

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;

// ============================================
// GAME VALIDATION
// ============================================

const gameBaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(GameCategoryEnum),
  icon: z.string().optional(),
  thumbnailUrl: z.url('Invalid thumbnail URL format').optional(),
  thumbnailKey: z.string().optional(),
  gameUrl: z.url('Invalid game URL format').optional(),
  provider: z.enum(GameProviderEnum).default('SELF_HOSTED'),
  orientation: z.enum(GameOrientationEnum).default('BOTH'),
  baseReward: z.number().positive().default(50),
  maxReward: z.number().positive().default(150),
  maxPlaysPerDay: z.number().int().positive().max(100).default(10),
  minPlayDuration: z.number().int().positive().max(3600).default(30),
  maxRewardedSecondsPerDay: z.number().int().positive().max(28800).default(600),
  difficulty: z.number().int().min(1).max(5).default(1),
  isSponsored: z.boolean().default(false),
  sponsorName: z.string().optional(),
  sponsorLogo: z.url('Invalid sponsor logo URL format').optional(),
  sponsorWebsite: z.url('Invalid sponsor website URL format').optional(),
  sponsoredUntil: z.iso.datetime().optional(),
});

/**
 * Zod 4 check function for game reward validation
 */
function validateGameRewards({
  value,
  issues,
}: z.core.ParsePayload<{
  baseReward?: number;
  maxReward?: number;
  minPlayDuration?: number;
  maxRewardedSecondsPerDay?: number;
}>) {
  // On partial (update) schemas a field may simply not be part of this
  // patch — only compare pairs that are both actually present. Full
  // cross-field consistency after a partial update should be re-checked
  // at the service layer once merged with the existing record.
  if (
    value.maxReward !== undefined &&
    value.baseReward !== undefined &&
    value.maxReward < value.baseReward
  ) {
    issues.push({
      code: 'custom',
      path: ['maxReward'],
      message: 'maxReward must be greater than or equal to baseReward',
      input: value.maxReward,
    });
  }

  if (
    value.maxRewardedSecondsPerDay !== undefined &&
    value.minPlayDuration !== undefined &&
    value.maxRewardedSecondsPerDay < value.minPlayDuration
  ) {
    issues.push({
      code: 'custom',
      path: ['maxRewardedSecondsPerDay'],
      message: 'maxRewardedSecondsPerDay must be at least minPlayDuration',
      input: value.maxRewardedSecondsPerDay,
    });
  }
}

export const createGameSchema = gameBaseSchema
  .check(validateGameRewards)
  .check(validateSponsoredContent);

export const updateGameSchema = gameBaseSchema
  .partial()
  .check(validateGameRewards)
  .check(validateSponsoredContent);

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;

/**
 * Utility function for runtime reward validation
 */
export function assertGameRewardConfig(game: {
  baseReward: number;
  maxReward: number;
  minPlayDuration: number;
  maxRewardedSecondsPerDay: number;
}): void {
  if (game.maxReward < game.baseReward) {
    throw new Error('maxReward must be greater than or equal to baseReward');
  }
  if (game.maxRewardedSecondsPerDay < game.minPlayDuration) {
    throw new Error(
      'maxRewardedSecondsPerDay must be at least minPlayDuration',
    );
  }
}

/**
 * Calculate maximum daily cost per user for a game
 */
export function maxDailyCostPerUser(game: {
  baseReward: number;
  maxReward: number;
  minPlayDuration: number;
  maxPlaysPerDay: number;
  maxRewardedSecondsPerDay: number;
}): number {
  const rewardAtSecondsCap = Math.min(
    (game.maxRewardedSecondsPerDay / game.minPlayDuration) * game.baseReward,
    game.maxReward * game.maxPlaysPerDay,
  );
  return Math.round(rewardAtSecondsCap);
}

// ============================================
// SURVEY VALIDATION
// ============================================

const surveyBaseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  brand: z.string().min(1),
  brandLogo: z.url('Invalid brand logo URL format').optional(),
  brandLogoKey: z.string().optional(),
  category: z.enum(SurveyCategoryEnum),
  questionsCount: z.number().int().positive().default(5),
  estimatedTime: z.number().int().positive().default(5),
  rewardAmount: z.number().positive().default(200),
  maxParticipants: z.number().int().positive().optional(),
  isSponsored: z.boolean().default(false),
  sponsorName: z.string().optional(),
  sponsorLogo: z.url('Invalid sponsor logo URL format').optional(),
  sponsorWebsite: z.url('Invalid sponsor website URL format').optional(),
  sponsoredUntil: z.iso.datetime().optional(),
  startsAt: z.iso.datetime().optional(),
  endsAt: z.iso.datetime().optional(),
});

export const createSurveySchema = surveyBaseSchema.check(
  validateSponsoredContent,
);
export const updateSurveySchema = surveyBaseSchema
  .partial()
  .check(validateSponsoredContent);

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;

/**
 * Survey submission validation - answers carry their own questionId
 */
export const submitSurveySchema = z.object({
  surveyId: z.uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.union([z.string(), z.array(z.string())]),
      }),
    )
    .min(1),
});

export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>;

// ============================================
// EXPORT ALL VALIDATORS
// ============================================

export const validators = {
  video: {
    create: createVideoSchema,
    update: updateVideoSchema,
  },
  game: {
    create: createGameSchema,
    update: updateGameSchema,
  },
  survey: {
    create: createSurveySchema,
    update: updateSurveySchema,
    submit: submitSurveySchema,
  },
};
