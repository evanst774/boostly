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
  async watchVideo(
    videoId: string,
    watchPercent: number,
    watchDuration: number,
    deviceType?: string,
    browserInfo?: string,
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const video = await videosRepository.getById(videoId);
    if (!video) throw new Error('Video not found');
    if (video.status !== VideoStatusEnum.ACTIVE)
      throw new Error('Video not available');

    const clampedPercent = Math.max(0, Math.min(100, watchPercent));
    const safeDuration = Math.max(0, watchDuration);

    // Plausibility guard: don't accept a "completed" claim unless the
    // reported watch time is at least in the right ballpark for the
    // video's real length.
    const durationIsPlausible =
      !video.duration ||
      video.duration <= 0 ||
      safeDuration >= video.duration * 0.6;
    const isCompleted = clampedPercent >= 80 && durationIsPlausible;

    let watch = await videoWatchesRepository.getByUserAndVideo(
      user.id,
      videoId,
    );

    if (!watch) {
      watch = await videoWatchesRepository.create({
        videoId,
        userId: user.id,
        watchPercent: clampedPercent,
        watchDuration: safeDuration,
        completed: isCompleted,
        deviceType: deviceType || 'unknown',
        browserInfo: browserInfo || 'unknown',
        lastPosition: 0,
      });
    } else {
      watch = await videoWatchesRepository.updateProgress(watch.id, {
        watchPercent: clampedPercent,
        watchDuration: safeDuration,
        // Once completed, stays completed — this field is a lifetime
        // "has this user ever finished this video" marker, unrelated to
        // the daily reward gate below.
        completed: isCompleted || watch.completed,
        completedAt: isCompleted ? new Date().toISOString() : watch.completedAt,
        lastPosition: Math.floor(
          (clampedPercent / 100) * (video.duration || 0),
        ),
      });
    }

    await videosRepository.incrementWatchTime(videoId, safeDuration);

    if (!watch || !isCompleted) {
      return { rewardEarned: 0, watch };
    }

    // Per-plan daily cap on how many DIFFERENT videos can earn a reward.
    // Checked before crediting so a FREE-tier user can still watch past the
    // cap, they just stop earning — never a hard block on the content itself.
    const limits = await getUserDailyLimits(user.id);
    const todayVideoRewards = await rewardsService.getTodayRewardCount(
      user.id,
      RewardTypeEnum.VIDEO,
    );
    if (todayVideoRewards >= limits.maxDailyVideos) {
      return {
        rewardEarned: 0,
        watch,
        code: 'DAILY_LIMIT_REACHED',
        message: `You've reached your plan's daily video limit (${limits.maxDailyVideos}). Upgrade your plan to earn from more videos per day.`,
      };
    }

    // Daily-repeatable reward. Idempotency is enforced by the unique
    // (userId, dedupeKey) index inside rewardsService — this call is safe
    // to make every time a completion comes in; it will simply report
    // ALREADY_CREDITED if today's reward for this video was already paid.
    const scope = new Date().toISOString().slice(0, 10);

    const credit = await rewardsService.createReward({
      userId: user.id,
      type: RewardTypeEnum.VIDEO,
      baseAmount: video.rewardAmount,
      description: `Video reward: ${video.title}`,
      sourceId: video.id,
      sourceType: 'video',
      scope,
      metadata: { watchId: watch.id },
    });

    if (!credit.credited) {
      return {
        rewardEarned: 0,
        watch,
        code: credit.reason,
        message:
          credit.reason === 'ALREADY_CREDITED'
            ? "You've already earned the reward for this video today. Come back tomorrow!"
            : undefined,
      };
    }

    await videoWatchesRepository.updateProgress(watch.id, {
      rewardClaimed: true,
      rewardAmount: credit.amount,
    });

    await videosRepository.incrementViews(videoId);
    await videosRepository.updateCompletionRate(videoId);

    return { rewardEarned: credit.amount, watch };
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
