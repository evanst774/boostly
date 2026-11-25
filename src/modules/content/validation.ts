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
// URL HELPERS
// ============================================

/** Trim; add https:// when an admin types a bare domain (e.g. "mtn.co.rw"). */
function cleanUrl(v: unknown) {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!t) return undefined;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`;
}

/** Optional link: blank means "none" instead of failing validation. */
const optionalUrl = (message: string) => z.preprocess(cleanUrl, z.url(message).optional());

/** Required link (trimmed, https:// added when missing). */
const requiredUrl = (message: string) => z.preprocess(cleanUrl, z.url(message));

/**
 * For partial updates: keep only the fields the caller actually sent. Zod
 * fills `.default()` values in even on `.partial()` schemas, which silently
 * reset things like a video's status to DRAFT on unrelated edits.
 */
export function onlyProvided<T extends Record<string, unknown>>(validated: T, input: unknown): Partial<T> {
  if (!input || typeof input !== 'object') return {};
  const sent = new Set(Object.keys(input as Record<string, unknown>));
  return Object.fromEntries(Object.entries(validated).filter(([k]) => sent.has(k))) as Partial<T>;
}

/** First validation problem as a sentence an admin can act on. */
export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Please check the form.';
  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

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
  videoUrl: requiredUrl('Enter a valid video link (an uploaded file, a direct .mp4 link or a YouTube link)'),
  thumbnailUrl: optionalUrl('Invalid thumbnail URL format'),
  videoKey: z.string().optional(),
  thumbnailKey: z.string().optional(),
  rewardAmount: z.number().positive().default(40),
  // Sponsor-funded reward budget in RWF; null = no campaign budget.
  rewardBudget: z.number().positive().nullable().optional(),
  /** Plan keys allowed to use this item; empty/null = every plan. */
  allowedPlanTiers: z.array(z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9_]{1,31}$/)).max(30).nullable().optional(),
  bonusReward: z.number().positive().optional(),
  isSponsored: z.boolean().default(false),
  sponsorName: z.string().optional(),
  sponsorLogo: optionalUrl('Invalid sponsor logo URL format'),
  sponsorWebsite: optionalUrl('Invalid sponsor website URL format'),
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
  thumbnailUrl: optionalUrl('Invalid thumbnail URL format'),
  thumbnailKey: z.string().optional(),
  gameUrl: optionalUrl('Invalid game URL format'),
  provider: z.enum(GameProviderEnum).default('SELF_HOSTED'),
  orientation: z.enum(GameOrientationEnum).default('BOTH'),
  baseReward: z.number().positive().default(50),
  // Sponsor-funded reward budget in RWF; null = no campaign budget.
  rewardBudget: z.number().positive().nullable().optional(),
  /** Plan keys allowed to use this item; empty/null = every plan. */
  allowedPlanTiers: z.array(z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9_]{1,31}$/)).max(30).nullable().optional(),
  maxReward: z.number().positive().default(150),
  maxPlaysPerDay: z.number().int().positive().max(100).default(10),
  minPlayDuration: z.number().int().positive().max(3600).default(30),
  maxRewardedSecondsPerDay: z.number().int().positive().max(28800).default(600),
  difficulty: z.number().int().min(1).max(5).default(1),
  isSponsored: z.boolean().default(false),
  sponsorName: z.string().optional(),
  sponsorLogo: optionalUrl('Invalid sponsor logo URL format'),
  sponsorWebsite: optionalUrl('Invalid sponsor website URL format'),
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
  brandLogo: optionalUrl('Invalid brand logo URL format'),
  brandLogoKey: z.string().optional(),
  category: z.enum(SurveyCategoryEnum),
  questionsCount: z.number().int().positive().default(5),
  estimatedTime: z.number().int().positive().default(5),
  rewardAmount: z.number().positive().default(200),
  // Sponsor-funded reward budget in RWF; null = no campaign budget.
  rewardBudget: z.number().positive().nullable().optional(),
  /** Plan keys allowed to use this item; empty/null = every plan. */
  allowedPlanTiers: z.array(z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9_]{1,31}$/)).max(30).nullable().optional(),
  maxParticipants: z.number().int().positive().optional(),
  isSponsored: z.boolean().default(false),
  sponsorName: z.string().optional(),
  sponsorLogo: optionalUrl('Invalid sponsor logo URL format'),
  sponsorWebsite: optionalUrl('Invalid sponsor website URL format'),
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
