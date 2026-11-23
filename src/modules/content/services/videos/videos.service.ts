// src/modules/content/services/videos/videos.service.ts
import {
  videosRepository,
  videoTagsRepository,
  videoEngagementsRepository,
  videoWatchesRepository,
} from '../../repositories/videos';
import {
  createVideoSchema,
  updateVideoSchema,
  type CreateVideoInput,
  type UpdateVideoInput,
} from '../../validation';
import { createAuditLog } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '../../permissions';
import { VideoStatusEnum } from '@/lib/db/schema';
import type {
  VideoCategory,
  VideoStatus,
  VideoDifficulty,
  VideoTag,
} from '@/lib/db/schema/videos';
import { rewardsService } from '@/modules/rewards/service';
import { RewardTypeEnum } from '@/lib/db/schema/rewards';
import { getUserDailyLimits } from '@/modules/rewards/plan-limits';
import { kigaliDateKey } from '@/lib/constants/payouts';
import { issueTaskToken, elapsedSinceTaskStart } from '@/lib/task-token';

/** A user-facing video problem, mapped to an HTTP status by the route. */
export class VideoTaskError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export class VideosService {
  async createVideo(input: CreateVideoInput) {
    await requirePermission(ContentPermissions.VIDEOS_CREATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createVideoSchema.parse(input);
    const video = await videosRepository.create({
      ...validated,
      createdBy: user.id,
      updatedBy: user.id,
      status: VideoStatusEnum.DRAFT,
    });

    if (validated.tags && validated.tags.length > 0) {
      await videoTagsRepository.createMany(validated.tags, video.id);
    }

    await createAuditLog({
      userId: user.id,
      action: 'VIDEO_CREATED',
      entityType: 'video',
      entityId: video.id,
      newData: video,
    });

    return video;
  }

  async getVideo(id: string) {
    await requirePermission(ContentPermissions.VIDEOS_READ);
    const video = await videosRepository.getByIdWithDetails(id);
    if (!video) throw new Error('Video not found');

    // getByIdWithDetails() eager-loads real `video_tags` rows (objects
    // shaped { id, videoId, tag, createdAt }), but every caller of
    // getVideo() expects `tags` to be string[] (edit page's formData.tags,
    // its `#{tag}` rendering, its duplicate check, and createVideo()'s own
    // write path). Flatten here, at the source.
    return {
      ...video,
      tags: (video.tags ?? []).map((t: VideoTag) => t.tag),
    };
  }

  async getVideoWithEngagement(id: string, userId?: string) {
    const video = await this.getVideo(id);
    const engagementStats =
      await videoEngagementsRepository.getEngagementStats(id);

    let userEngagement = null;
    if (userId) {
      const engagements = await videoEngagementsRepository.getByUserAndVideo(
        userId,
        id,
      );
      userEngagement = {
        liked: engagements.some((e) => e.type === 'like'),
        disliked: engagements.some((e) => e.type === 'dislike'),
        saved: engagements.some((e) => e.type === 'save'),
        shared: engagements.some((e) => e.type === 'share'),
      };
    }

    return { ...video, engagementStats, userEngagement };
  }

  async getActiveVideos() {
    return await videosRepository.getActiveVideos();
  }

  async getSponsoredVideos() {
    return await videosRepository.getSponsoredVideos();
  }

  /**
   * Earn page list: ACTIVE videos only, with this user's progress, whether the
   * video already paid today, and quota stats.
   */
  async listForUser(filters: {
    category?: VideoCategory;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 50);

    const [result, watches, limits, doneToday, paidToday, earnings] =
      await Promise.all([
        videosRepository.getVideos({
          category: filters.category,
          search: filters.search,
          status: VideoStatusEnum.ACTIVE,
          page,
          limit,
        }),
        videoWatchesRepository.getUserWatches(user.id),
        getUserDailyLimits(user.id),
        rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.VIDEO),
        rewardsService.getTodaySourceIds(user.id, RewardTypeEnum.VIDEO),
        rewardsService.getEarningsByType(user.id),
      ]);

    const progress = new Map(watches.map((w) => [w.videoId, w]));
    const videos = result.videos.map((v) => ({
      ...v,
      watchProgress: progress.get(v.id)?.watchPercent ?? 0,
      isWatched: progress.get(v.id)?.completed ?? false,
      earnedToday: paidToday.has(v.id),
    }));

    return {
      videos,
      total: result.total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(result.total / limit)),
      stats: {
        totalEarned:
          earnings.find((e) => e.type === RewardTypeEnum.VIDEO)?.total ?? 0,
        watched: doneToday,
        available: Math.max(0, limits.maxDailyVideos - doneToday),
        dailyLimit: limits.maxDailyVideos,
      },
    };
  }

  async getVideos(filters: {
    category?: VideoCategory;
    status?: VideoStatus;
    difficulty?: VideoDifficulty;
    search?: string;
    isSponsored?: boolean;
    tag?: string;
    page?: number;
    limit?: number;
  }) {
    await requirePermission(ContentPermissions.VIDEOS_READ);
    return await videosRepository.getVideos(filters);
  }

  async updateVideo(id: string, input: UpdateVideoInput) {
    await requirePermission(ContentPermissions.VIDEOS_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await videosRepository.getById(id);
    if (!existing) throw new Error('Video not found');

    const validated = updateVideoSchema.parse(input);
    const updated = await videosRepository.update(id, {
      ...validated,
      updatedBy: user.id,
    });

    if (validated.tags) {
      await videoTagsRepository.deleteByVideoId(id);
      if (validated.tags.length > 0) {
        await videoTagsRepository.createMany(validated.tags, id);
      }
    }

    await createAuditLog({
      userId: user.id,
      action: 'VIDEO_UPDATED',
      entityType: 'video',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async publishVideo(id: string) {
    await requirePermission(ContentPermissions.VIDEOS_PUBLISH);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await videosRepository.getById(id);
    if (!existing) throw new Error('Video not found');

    const updated = await videosRepository.update(id, {
      status: VideoStatusEnum.ACTIVE,
      publishedAt: new Date().toISOString(),
      updatedBy: user.id,
    });

    await createAuditLog({
      userId: user.id,
      action: 'VIDEO_PUBLISHED',
      entityType: 'video',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  /**
   * Sets status to INACTIVE rather than DRAFT: DRAFT means "never
   * published," INACTIVE means "was live, currently taken down."
   * Intentionally leaves `publishedAt` untouched — it's a historical record
   * of when the video first went live, not a "currently live" flag.
   * Re-publishing later calls publishVideo() again, which correctly
   * overwrites publishedAt with the new go-live time.
   */
  async unpublishVideo(id: string) {
    await requirePermission(ContentPermissions.VIDEOS_PUBLISH);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await videosRepository.getById(id);
    if (!existing) throw new Error('Video not found');

    const updated = await videosRepository.update(id, {
      status: VideoStatusEnum.INACTIVE,
      updatedBy: user.id,
    });

    await createAuditLog({
      userId: user.id,
      action: 'VIDEO_UNPUBLISHED',
      entityType: 'video',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async deleteVideo(id: string) {
    await requirePermission(ContentPermissions.VIDEOS_DELETE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await videosRepository.getById(id);
    if (!existing) throw new Error('Video not found');

    await videosRepository.delete(id);

    await createAuditLog({
      userId: user.id,
      action: 'VIDEO_DELETED',
      entityType: 'video',
      entityId: id,
      oldData: existing,
    });
  }

  /**
   * Records watch progress and, once the video is completed, credits the
   * reward.
   *
   * FIX (previous bugs):
   *
   * 1. There used to be a `hasUserWatchedToday()` pre-check that filtered
   *    `video_watches` on `date(createdAt) = today`. But `video_watches`
   *    has a UNIQUE (userId, videoId) index — one row per user+video,
   *    EVER, created once and updated in place after that. `createdAt`
   *    therefore never changes after the first-ever watch, so that check
   *    could only ever return true on day one and was a permanent no-op
   *    after that.
   *
   * 2. Worse: the actual reward gate was `watch.completed &&
   *    !watch.rewardClaimed`. Because `rewardClaimed` lives on that same
   *    single, permanent row and was never reset, once a user earned the
   *    reward once, `rewardClaimed` stayed `true` forever — so no matter
   *    how many days passed, the video could never pay out again. That
   *    directly contradicts the reward system's own design: `sourceId`'s
   *    dedupe scope in `rewardsService.createReward()` is today's date
   *    (`YYYY-MM-DD`), which only makes sense for a DAILY-repeatable
   *    reward.
   *
   * The fix: stop gating on the sticky `rewardClaimed` flag. Instead,
   * every time a watch is completed, ask `rewardsService.createReward()`
   * whether *today's* reward for this video has already been paid — that
   * per-day idempotency lives in the unique `(userId, dedupeKey)` index on
   * the `rewards` table, which is the actual, race-safe source of truth.
   * `rewardClaimed` / `rewardAmount` on `video_watches` are now purely
   * informational (last-claimed record), not a gate.
   *
   * Also added: a plausibility check so a client can't just POST
   * `watchPercent: 100` immediately after opening a video. Completion now
   * additionally requires the reported `watchDuration` to be at least 60%
   * of the video's real length. This is a minimum bar, not a substitute
   * for the player-side anti-skip logic — a determined attacker could
   * still script around it — but it stops the trivial "one fetch call"
   * exploit.
   */
  /**
   * Called when a user opens a video. Returns a signed start token (the server
   * clock is the source of truth for watch time) and today's reward status.
   */
  async startWatch(videoId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const video = await videosRepository.getById(videoId);
    if (!video || video.status !== VideoStatusEnum.ACTIVE) {
      throw new VideoTaskError(404, 'NOT_AVAILABLE', 'This video is no longer available.');
    }

    const [watch, limits, doneToday, earnedToday] = await Promise.all([
      videoWatchesRepository.getByUserAndVideo(user.id, videoId),
      getUserDailyLimits(user.id),
      rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.VIDEO),
      rewardsService.hasReward(user.id, RewardTypeEnum.VIDEO, video.id, kigaliDateKey()),
    ]);

    return {
      startToken: issueTaskToken(user.id, 'video', videoId),
      watchPercent: watch?.watchPercent ?? 0,
      alreadyEarnedToday: earnedToday,
      remainingToday: Math.max(0, limits.maxDailyVideos - doneToday),
      dailyLimit: limits.maxDailyVideos,
    };
  }

  /**
   * Progress ping (5% steps). Only ever moves progress forward and never pays;
   * payment happens in completeWatch().
   */
  async reportProgress(videoId: string, watchPercent: number, watchDuration: number, deviceType?: string, browserInfo?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const video = await videosRepository.getById(videoId);
    if (!video || video.status !== VideoStatusEnum.ACTIVE) {
      throw new VideoTaskError(404, 'NOT_AVAILABLE', 'This video is no longer available.');
    }

    const pct = Math.max(0, Math.min(100, Number(watchPercent) || 0));
    const secs = Math.max(0, Number(watchDuration) || 0);
    const existing = await videoWatchesRepository.getByUserAndVideo(user.id, videoId);

    if (!existing) {
      await videoWatchesRepository.create({
        videoId,
        userId: user.id,
        watchPercent: pct,
        watchDuration: secs,
        completed: false,
        deviceType: deviceType || 'unknown',
        browserInfo: browserInfo || 'unknown',
        lastPosition: Math.floor((pct / 100) * (video.duration || 0)),
      });
    } else if (pct > existing.watchPercent) {
      await videoWatchesRepository.updateProgress(existing.id, {
        watchPercent: pct,
        watchDuration: Math.max(existing.watchDuration ?? 0, secs),
        lastPosition: Math.floor((pct / 100) * (video.duration || 0)),
      });
      await videosRepository.incrementWatchTime(videoId, Math.max(0, secs - (existing.watchDuration ?? 0)));
    }
    return { ok: true };
  }

  /**
   * The video ended. Pays today's reward once, provided enough real time has
   * passed since the server issued the start token.
   */
  async completeWatch(videoId: string, startToken: string | undefined, watchDuration: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const video = await videosRepository.getById(videoId);
    if (!video || video.status !== VideoStatusEnum.ACTIVE) {
      throw new VideoTaskError(404, 'NOT_AVAILABLE', 'This video is no longer available.');
    }

    const elapsed = elapsedSinceTaskStart(startToken, user.id, 'video', videoId);
    if (elapsed === null) {
      throw new VideoTaskError(400, 'RESTART', 'Your viewing session expired. Please reopen the video.');
    }
    const minMs = video.duration && video.duration > 0 ? video.duration * 0.6 * 1000 : 15_000;
    if (elapsed < minMs) {
      throw new VideoTaskError(400, 'TOO_FAST', 'Watch the video to the end to earn the reward.');
    }

    const secs = Math.max(0, Number(watchDuration) || 0);
    const now = new Date().toISOString();
    let watch = await videoWatchesRepository.getByUserAndVideo(user.id, videoId);
    if (!watch) {
      watch = await videoWatchesRepository.create({
        videoId,
        userId: user.id,
        watchPercent: 100,
        watchDuration: secs,
        completed: true,
        completedAt: now,
        deviceType: 'unknown',
        browserInfo: 'unknown',
        lastPosition: video.duration || 0,
      });
    } else {
      watch = (await videoWatchesRepository.updateProgress(watch.id, {
        watchPercent: 100,
        watchDuration: Math.max(watch.watchDuration ?? 0, secs),
        completed: true,
        completedAt: now,
        lastPosition: video.duration || 0,
      })) ?? watch;
    }

    // Per-plan daily cap on how many different videos can earn a reward.
    const limits = await getUserDailyLimits(user.id);
    const todayVideoRewards = await rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.VIDEO);
    const alreadyEarned = await rewardsService.hasReward(user.id, RewardTypeEnum.VIDEO, video.id, kigaliDateKey());
    if (alreadyEarned) {
      return {
        rewardEarned: 0,
        code: 'ALREADY_CREDITED',
        message: "You've already earned this video's reward today. Try another video!",
      };
    }
    if (todayVideoRewards >= limits.maxDailyVideos) {
      return {
        rewardEarned: 0,
        code: 'DAILY_LIMIT_REACHED',
        message: `You've used today's ${limits.maxDailyVideos} rewarded videos. Come back tomorrow or upgrade your plan for more.`,
      };
    }

    const credit = await rewardsService.createReward({
      userId: user.id,
      type: RewardTypeEnum.VIDEO,
      baseAmount: video.rewardAmount,
      description: `Video reward: ${video.title}`,
      sourceId: video.id,
      sourceType: 'video',
      scope: kigaliDateKey(), // once per video per day
      metadata: { watchId: watch.id },
      dailyCap: limits.maxDailyVideos,
      budget: { table: 'videos', id: video.id },
    });

    if (!credit.credited) {
      return {
        rewardEarned: 0,
        code: credit.reason,
        message:
          credit.reason === 'ALREADY_CREDITED'
            ? "You've already earned this video's reward today. Try another video!"
            : credit.reason === 'DAILY_LIMIT'
              ? `You've used today's ${limits.maxDailyVideos} rewarded videos. Come back tomorrow or upgrade your plan for more.`
              : credit.reason === 'DAILY_EARNINGS_MAX'
                ? "You've reached today's earning maximum for your plan. Come back tomorrow, or upgrade to earn more each day."
              : credit.reason === 'BUDGET_EXHAUSTED'
                ? "This video's sponsored rewards are used up for now. Try another video!"
                : 'This video has no reward.',
      };
    }

    await videoWatchesRepository.updateProgress(watch.id, {
      rewardClaimed: true,
      rewardAmount: credit.amount,
    });
    await videosRepository.incrementViews(videoId);
    await videosRepository.updateCompletionRate(videoId);

    return { rewardEarned: credit.amount, newBalance: credit.newBalance };
  }

  async getVideoStats() {
    await requirePermission(ContentPermissions.VIDEOS_READ);
    return await videosRepository.getStats();
  }

  async getPopularVideos(limit?: number) {
    return await videosRepository.getPopularVideos(limit);
  }

  async getTrendingVideos(limit?: number) {
    return await videosRepository.getTrendingVideos(limit);
  }

  async getUserWatchHistory(userId?: string) {
    const user = userId ? await getCurrentUser() : null;
    if (userId && !user) throw new Error('Unauthorized');
    return await videoWatchesRepository.getUserWatches(userId || user!.id, 50);
  }

  async getUserWatchStats(userId?: string) {
    const user = userId ? await getCurrentUser() : null;
    if (userId && !user) throw new Error('Unauthorized');

    const uid = userId || user!.id;
    const [watchCount, watchTime, completedCount] = await Promise.all([
      videoWatchesRepository.getWatchCount(uid),
      videoWatchesRepository.getWatchTime(uid),
      videoWatchesRepository.getCompletedCount(uid),
    ]);

    return {
      watchCount,
      watchTime,
      completedCount,
      averageWatchTime: watchCount > 0 ? watchTime / watchCount : 0,
    };
  }

  async getVideoWatchProgress(videoId: string) {
    const user = await getCurrentUser();
    if (!user) return null;
    return await videoWatchesRepository.getByUserAndVideo(user.id, videoId);
  }

  async resumeVideo(videoId: string) {
    const progress = await this.getVideoWatchProgress(videoId);
    if (!progress) return { lastPosition: 0 };
    return {
      lastPosition: progress.lastPosition || 0,
      watchPercent: progress.watchPercent,
      completed: progress.completed,
    };
  }

  async getPopularTags(limit?: number) {
    return await videoTagsRepository.getPopularTags(limit);
  }

  async getVideosByTag(tag: string) {
    return await videoTagsRepository.getVideosByTag(tag);
  }
}

export const videosService = new VideosService();
