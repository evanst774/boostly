// src/lib/db/schema/videos.ts
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
export const VideoCategoryEnum = {
  BUSINESS: 'BUSINESS',
  FINANCE: 'FINANCE',
  TECH: 'TECH',
  EDUCATION: 'EDUCATION',
  ENTERTAINMENT: 'ENTERTAINMENT',
  LIFESTYLE: 'LIFESTYLE',
  GAMING: 'GAMING',
  SPORTS: 'SPORTS',
  MUSIC: 'MUSIC',
  NEWS: 'NEWS',
  TUTORIAL: 'TUTORIAL',
} as const;

export type VideoCategory =
  (typeof VideoCategoryEnum)[keyof typeof VideoCategoryEnum];
export const VIDEO_CATEGORY_LIST = Object.values(VideoCategoryEnum);

export const VideoStatusEnum = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  REJECTED: 'REJECTED',
} as const;

export type VideoStatus =
  (typeof VideoStatusEnum)[keyof typeof VideoStatusEnum];
export const VIDEO_STATUS_LIST = Object.values(VideoStatusEnum);

export const VideoDifficultyEnum = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
} as const;

export type VideoDifficulty =
  (typeof VideoDifficultyEnum)[keyof typeof VideoDifficultyEnum];
export const VIDEO_DIFFICULTY_LIST = Object.values(VideoDifficultyEnum);

// ============================================
// VIDEOS TABLE
// ============================================
export const videos = sqliteTable(
  'videos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Video metadata
    title: text('title').notNull(),
    description: text('description'),
    category: text('category').$type<VideoCategory>().notNull(),
    difficulty: text('difficulty').$type<VideoDifficulty>().default('BEGINNER'),
    duration: integer('duration'), // in seconds

    // Video URLs
    videoUrl: text('videoUrl').notNull(),
    thumbnailUrl: text('thumbnailUrl'),
    videoKey: text('videoKey'), // R2/S3 storage key
    thumbnailKey: text('thumbnailKey'),

    // Reward
    rewardAmount: real('rewardAmount').notNull().default(40), // Rwf per video
    bonusReward: real('bonusReward'), // Bonus for completing all videos in a series

    // Sponsored content
    isSponsored: integer('isSponsored', { mode: 'boolean' })
      .notNull()
      .default(false),
    sponsorName: text('sponsorName'),
    sponsorLogo: text('sponsorLogo'),
    sponsorWebsite: text('sponsorWebsite'),
    sponsoredUntil: text('sponsoredUntil'), // ISO date string

    // Status
    status: text('status').$type<VideoStatus>().notNull().default('DRAFT'),

    // Engagement metrics
    views: integer('views').notNull().default(0),
    watchTime: integer('watchTime').notNull().default(0), // total seconds watched
    likes: integer('likes').notNull().default(0),
    dislikes: integer('dislikes').notNull().default(0),
    shares: integer('shares').notNull().default(0),
    saves: integer('saves').notNull().default(0),
    completionRate: real('completionRate').default(0), // percentage

    // Admin who added/updated
    createdBy: text('createdBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    updatedBy: text('updatedBy').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Timestamps
    publishedAt: text('publishedAt'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('videos_category_idx').on(table.category),
    index('videos_status_idx').on(table.status),
    index('videos_created_at_idx').on(table.createdAt),
    index('videos_reward_idx').on(table.rewardAmount),
    index('videos_sponsored_idx').on(table.isSponsored),
    index('videos_published_at_idx').on(table.publishedAt),
    index('videos_difficulty_idx').on(table.difficulty),
  ],
);

// ============================================
// VIDEO TAGS TABLE
// ============================================
export const videoTags = sqliteTable(
  'video_tags',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    videoId: text('videoId')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('video_tags_video_idx').on(table.videoId),
    index('video_tags_tag_idx').on(table.tag),
    uniqueIndex('video_tags_unique_idx').on(table.videoId, table.tag),
  ],
);

// ============================================
// VIDEO ENGAGEMENTS TABLE
// ============================================
export const videoEngagements = sqliteTable(
  'video_engagements',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    videoId: text('videoId')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<'like' | 'dislike' | 'share' | 'save'>(),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('video_engagements_video_idx').on(table.videoId),
    index('video_engagements_user_idx').on(table.userId),
    index('video_engagements_type_idx').on(table.type),
    uniqueIndex('video_engagements_user_video_type_idx').on(
      table.userId,
      table.videoId,
      table.type,
    ),
  ],
);

// ============================================
// VIDEO PLAYLISTS TABLE
// ============================================
export const videoPlaylists = sqliteTable(
  'video_playlists',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnailUrl'),
    thumbnailKey: text('thumbnailKey'),
    createdBy: text('createdBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(true),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    views: integer('views').notNull().default(0),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('video_playlists_created_by_idx').on(table.createdBy),
    index('video_playlists_is_public_idx').on(table.isPublic),
    index('video_playlists_featured_idx').on(table.featured),
  ],
);

// ============================================
// PLAYLIST VIDEOS TABLE
// ============================================
export const playlistVideos = sqliteTable(
  'playlist_videos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    playlistId: text('playlistId')
      .notNull()
      .references(() => videoPlaylists.id, { onDelete: 'cascade' }),
    videoId: text('videoId')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    order: integer('order').notNull().default(0),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('playlist_videos_playlist_idx').on(table.playlistId),
    index('playlist_videos_video_idx').on(table.videoId),
    uniqueIndex('playlist_videos_playlist_video_idx').on(
      table.playlistId,
      table.videoId,
    ),
  ],
);

// ============================================
// VIDEO WATCHES TABLE (track user progress)
// ============================================
export const videoWatches = sqliteTable(
  'video_watches',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    videoId: text('videoId')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Watch progress
    watchPercent: real('watchPercent').notNull().default(0),
    watchDuration: integer('watchDuration').notNull().default(0), // seconds watched
    completed: integer('completed', { mode: 'boolean' })
      .notNull()
      .default(false),

    // Watch points (for engagement scoring)
    watchPoints: integer('watchPoints').notNull().default(0),

    // Reward claimed
    rewardClaimed: integer('rewardClaimed', { mode: 'boolean' })
      .notNull()
      .default(false),
    rewardAmount: real('rewardAmount'),

    // Device info for analytics
    deviceType: text('deviceType'), // 'mobile' | 'desktop' | 'tablet'
    browserInfo: text('browserInfo'),

    // Timestamps
    startedAt: text('startedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    completedAt: text('completedAt'),
    lastPosition: integer('lastPosition').notNull().default(0), // last position in seconds
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('video_watches_video_idx').on(table.videoId),
    index('video_watches_user_idx').on(table.userId),
    index('video_watches_completed_idx').on(table.completed),
    index('video_watches_reward_claimed_idx').on(table.rewardClaimed),
    index('video_watches_started_at_idx').on(table.startedAt),
    // NOTE: this uniqueIndex means there is ONE row per (userId, videoId)
    // EVER, created once and updated in place thereafter. That matters for
    // VideosService.hasUserWatchedToday(), which currently filters on
    // `date(createdAt) = today` — createdAt is set only at first-ever watch
    // and never changes, so that check can only ever be true on day one.
    // See the flag comment on hasUserWatchedToday in videos.service.ts.
    index('video_watches_user_date_idx').on(
      table.userId,
      sql`date(${table.createdAt})`,
    ),
    index('video_watches_video_user_date_idx').on(
      table.videoId,
      table.userId,
      sql`date(${table.createdAt})`,
    ),
    uniqueIndex('video_watches_user_video_idx').on(table.userId, table.videoId),
  ],
);

// ============================================
// VIDEO COMMENTS TABLE
// ============================================
export const videoComments = sqliteTable(
  'video_comments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    videoId: text('videoId')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: text('parentId'),
    content: text('content').notNull(),
    likes: integer('likes').notNull().default(0),
    isPinned: integer('isPinned', { mode: 'boolean' }).notNull().default(false),
    isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('video_comments_video_idx').on(table.videoId),
    index('video_comments_user_idx').on(table.userId),
    index('video_comments_parent_idx').on(table.parentId),
    index('video_comments_created_at_idx').on(table.createdAt),
    index('video_comments_is_hidden_idx').on(table.isHidden),
  ],
);

// ============================================
// VIDEO REPORTING TABLE
// ============================================
export const videoReports = sqliteTable(
  'video_reports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    videoId: text('videoId')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    description: text('description'),
    status: text('status')
      .$type<'pending' | 'reviewed' | 'dismissed' | 'action_taken'>()
      .notNull()
      .default('pending'),
    reviewedBy: text('reviewedBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: text('reviewedAt'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('video_reports_video_idx').on(table.videoId),
    index('video_reports_user_idx').on(table.userId),
    index('video_reports_status_idx').on(table.status),
    uniqueIndex('video_reports_user_video_idx').on(table.userId, table.videoId),
  ],
);

// ============================================
// TYPES
// ============================================
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type VideoWatch = typeof videoWatches.$inferSelect;
export type NewVideoWatch = typeof videoWatches.$inferInsert;

export type VideoTag = typeof videoTags.$inferSelect;
export type NewVideoTag = typeof videoTags.$inferInsert;

export type VideoEngagement = typeof videoEngagements.$inferSelect;
export type NewVideoEngagement = typeof videoEngagements.$inferInsert;

export type VideoPlaylist = typeof videoPlaylists.$inferSelect;
export type NewVideoPlaylist = typeof videoPlaylists.$inferInsert;

export type PlaylistVideo = typeof playlistVideos.$inferSelect;
export type NewPlaylistVideo = typeof playlistVideos.$inferInsert;

export type VideoComment = typeof videoComments.$inferSelect;
export type NewVideoComment = typeof videoComments.$inferInsert;

export type VideoReport = typeof videoReports.$inferSelect;
export type NewVideoReport = typeof videoReports.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const videosRelations = relations(videos, ({ many, one }) => ({
  watches: many(videoWatches),
  tags: many(videoTags),
  engagements: many(videoEngagements),
  comments: many(videoComments),
  reports: many(videoReports),
  playlistEntries: many(playlistVideos),
  creator: one(users, {
    fields: [videos.createdBy],
    references: [users.id],
  }),
  updater: one(users, {
    fields: [videos.updatedBy],
    references: [users.id],
  }),
}));

export const videoWatchesRelations = relations(videoWatches, ({ one }) => ({
  video: one(videos, {
    fields: [videoWatches.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoWatches.userId],
    references: [users.id],
  }),
}));

export const videoTagsRelations = relations(videoTags, ({ one }) => ({
  video: one(videos, {
    fields: [videoTags.videoId],
    references: [videos.id],
  }),
}));

export const videoEngagementsRelations = relations(
  videoEngagements,
  ({ one }) => ({
    video: one(videos, {
      fields: [videoEngagements.videoId],
      references: [videos.id],
    }),
    user: one(users, {
      fields: [videoEngagements.userId],
      references: [users.id],
    }),
  }),
);

export const videoPlaylistsRelations = relations(
  videoPlaylists,
  ({ many, one }) => ({
    videos: many(playlistVideos),
    creator: one(users, {
      fields: [videoPlaylists.createdBy],
      references: [users.id],
    }),
  }),
);

export const playlistVideosRelations = relations(playlistVideos, ({ one }) => ({
  playlist: one(videoPlaylists, {
    fields: [playlistVideos.playlistId],
    references: [videoPlaylists.id],
  }),
  video: one(videos, {
    fields: [playlistVideos.videoId],
    references: [videos.id],
  }),
}));

// FIX: video_comments self-joins twice (parent lookup + replies list), and
// Drizzle's relational query builder can't tell those two relations apart
// without an explicit relationName on both ends — that ambiguity is exactly
// what "There are multiple relations between videoComments and
// video_comments" means. Giving both ends of the SAME logical relationship
// the same relationName resolves it.
export const videoCommentsRelations = relations(
  videoComments,
  ({ one, many }) => ({
    video: one(videos, {
      fields: [videoComments.videoId],
      references: [videos.id],
    }),
    user: one(users, {
      fields: [videoComments.userId],
      references: [users.id],
    }),
    parent: one(videoComments, {
      fields: [videoComments.parentId],
      references: [videoComments.id],
      relationName: 'video_comment_replies',
    }),
    replies: many(videoComments, {
      relationName: 'video_comment_replies',
    }),
  }),
);

export const videoReportsRelations = relations(videoReports, ({ one }) => ({
  video: one(videos, {
    fields: [videoReports.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoReports.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [videoReports.reviewedBy],
    references: [users.id],
  }),
}));
