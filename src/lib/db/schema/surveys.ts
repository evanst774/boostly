// src/lib/db/schema/surveys.ts
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// ENUMS
// ============================================
export const SurveyStatusEnum = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  DRAFT: 'DRAFT',
  PAUSED: 'PAUSED',
} as const;

export type SurveyStatus =
  (typeof SurveyStatusEnum)[keyof typeof SurveyStatusEnum];
export const SURVEY_STATUS_LIST = Object.values(SurveyStatusEnum);

export const SurveyCategoryEnum = {
  TECHNOLOGY: 'TECHNOLOGY',
  SHOPPING: 'SHOPPING',
  FINANCE: 'FINANCE',
  HEALTHCARE: 'HEALTHCARE',
  EDUCATION: 'EDUCATION',
  ENTERTAINMENT: 'ENTERTAINMENT',
  LIFESTYLE: 'LIFESTYLE',
  TELECOMMUNICATIONS: 'TELECOMMUNICATIONS',
  RETAIL: 'RETAIL',
  BANKING: 'BANKING',
} as const;

export type SurveyCategory =
  (typeof SurveyCategoryEnum)[keyof typeof SurveyCategoryEnum];
export const SURVEY_CATEGORY_LIST = Object.values(SurveyCategoryEnum);

// ============================================
// SURVEYS TABLE
// ============================================
export const surveys = sqliteTable(
  'surveys',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Survey metadata
    title: text('title').notNull(),
    description: text('description'),
    brand: text('brand').notNull(), // sponsored by
    brandLogo: text('brandLogo'),
    brandLogoKey: text('brandLogoKey'),
    category: text('category').$type<SurveyCategory>().notNull(),

    // Survey details
    questionsCount: integer('questionsCount').notNull().default(5),
    estimatedTime: integer('estimatedTime').notNull().default(5), // minutes

    // Reward
    rewardAmount: real('rewardAmount').notNull().default(200), // Rwf

    // ✅ Sponsored content - ADD THESE
    isSponsored: integer('isSponsored', { mode: 'boolean' })
      .notNull()
      .default(false),
    sponsorName: text('sponsorName'),
    sponsorLogo: text('sponsorLogo'),
    sponsorWebsite: text('sponsorWebsite'),
    sponsoredUntil: text('sponsoredUntil'),

    // Status
    status: text('status').$type<SurveyStatus>().notNull().default('DRAFT'),

    // Limits
    maxParticipants: integer('maxParticipants'),
    currentParticipants: integer('currentParticipants').notNull().default(0),

    // Engagement metrics
    views: integer('views').notNull().default(0),
    completionRate: real('completionRate').default(0), // percentage
    averageRating: real('averageRating').default(0),

    // Admin
    createdBy: text('createdBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    updatedBy: text('updatedBy').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Timestamps
    startsAt: text('startsAt'),
    endsAt: text('endsAt'),
    publishedAt: text('publishedAt'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('surveys_status_idx').on(table.status),
    index('surveys_brand_idx').on(table.brand),
    index('surveys_category_idx').on(table.category),
    index('surveys_created_at_idx').on(table.createdAt),
    index('surveys_reward_idx').on(table.rewardAmount),
    index('surveys_ends_at_idx').on(table.endsAt),
    // ✅ ADD THIS INDEX
    index('surveys_sponsored_idx').on(table.isSponsored),
    index('surveys_published_at_idx').on(table.publishedAt),
  ],
);

// ============================================
// SURVEY QUESTIONS TABLE
// ============================================
export const surveyQuestions = sqliteTable(
  'survey_questions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    surveyId: text('surveyId')
      .notNull()
      .references(() => surveys.id, { onDelete: 'cascade' }),

    question: text('question').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),

    // Question type: single_choice, multiple_choice, rating, likert, text
    type: text('type')
      .$type<
        'single_choice' | 'multiple_choice' | 'rating' | 'likert' | 'text'
      >()
      .notNull()
      .default('single_choice'),

    // Options (JSON array)
    options: text('options', { mode: 'json' }).$type<string[]>().notNull(),

    // Required
    required: integer('required', { mode: 'boolean' }).notNull().default(true),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('survey_questions_survey_idx').on(table.surveyId),
    index('survey_questions_order_idx').on(table.order),
    index('survey_questions_type_idx').on(table.type),
  ],
);

// ============================================
// SURVEY RESPONSES TABLE
// ============================================
export const surveyResponses = sqliteTable(
  'survey_responses',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    surveyId: text('surveyId')
      .notNull()
      .references(() => surveys.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Responses (JSON array of answers)
    answers: text('answers', { mode: 'json' }).$type<
      Array<{
        questionId: string;
        answer: string | string[];
      }>
    >(),

    // Additional metadata
    timeSpent: integer('timeSpent').default(0), // seconds spent
    deviceType: text('deviceType'), // 'mobile' | 'desktop' | 'tablet'

    // Reward
    rewardClaimed: integer('rewardClaimed', { mode: 'boolean' })
      .notNull()
      .default(false),
    rewardAmount: real('rewardAmount'),

    // Completion
    completed: integer('completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    completedAt: text('completedAt'),

    // Rating (optional user rating of the survey)
    rating: integer('rating'), // 1-5

    // Timestamps
    startedAt: text('startedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('survey_responses_survey_idx').on(table.surveyId),
    index('survey_responses_user_idx').on(table.userId),
    index('survey_responses_completed_idx').on(table.completed),
    index('survey_responses_reward_claimed_idx').on(table.rewardClaimed),
    index('survey_responses_created_at_idx').on(table.createdAt),
    // Composite unique to prevent duplicate responses
    uniqueIndex('survey_responses_user_survey_idx').on(
      table.userId,
      table.surveyId,
    ),
  ],
);

// ============================================
// SURVEY RATINGS TABLE (for user feedback)
// ============================================
export const surveyRatings = sqliteTable(
  'survey_ratings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    surveyId: text('surveyId')
      .notNull()
      .references(() => surveys.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    rating: integer('rating').notNull(), // 1-5
    feedback: text('feedback'),

    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('survey_ratings_survey_idx').on(table.surveyId),
    index('survey_ratings_user_idx').on(table.userId),
    uniqueIndex('survey_ratings_user_survey_idx').on(
      table.userId,
      table.surveyId,
    ),
  ],
);

// ============================================
// TYPES
// ============================================
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type NewSurveyQuestion = typeof surveyQuestions.$inferInsert;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;
export type SurveyRating = typeof surveyRatings.$inferSelect;
export type NewSurveyRating = typeof surveyRatings.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const surveysRelations = relations(surveys, ({ many, one }) => ({
  questions: many(surveyQuestions),
  responses: many(surveyResponses),
  ratings: many(surveyRatings),
  creator: one(users, {
    fields: [surveys.createdBy],
    references: [users.id],
  }),
  updater: one(users, {
    fields: [surveys.updatedBy],
    references: [users.id],
  }),
}));

export const surveyQuestionsRelations = relations(
  surveyQuestions,
  ({ one }) => ({
    survey: one(surveys, {
      fields: [surveyQuestions.surveyId],
      references: [surveys.id],
    }),
  }),
);

export const surveyResponsesRelations = relations(
  surveyResponses,
  ({ one }) => ({
    survey: one(surveys, {
      fields: [surveyResponses.surveyId],
      references: [surveys.id],
    }),
    user: one(users, {
      fields: [surveyResponses.userId],
      references: [users.id],
    }),
  }),
);

export const surveyRatingsRelations = relations(surveyRatings, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyRatings.surveyId],
    references: [surveys.id],
  }),
  user: one(users, {
    fields: [surveyRatings.userId],
    references: [users.id],
  }),
}));
