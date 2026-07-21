// src/modules/content/repositories/videos/videos.repository.ts
import { db } from '@/lib/db';
import {
  videos,
  videoComments,
  videoEngagements,
  videoTags,
  videoWatches,
  VideoStatusEnum,
  type Video,
  type NewVideo,
  type VideoCategory,
  type VideoStatus,
  type VideoDifficulty,
  type VideoTag,
} from '@/lib/db/schema';
import { eq, and, sql, desc, or, like } from 'drizzle-orm';

export class VideosRepository {
  async create(data: NewVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return video;
  }

  async getById(id: string): Promise<Video | undefined> {
    return await db.query.videos.findFirst({
      where: eq(videos.id, id),
    });
  }

  async getByIdWithDetails(
    id: string,
  ): Promise<(Video & { tags: VideoTag[] }) | undefined> {
    return await db.query.videos.findFirst({
      where: eq(videos.id, id),
      with: {
        tags: true,
        comments: {
          where: eq(videoComments.isHidden, false),
          orderBy: [desc(videoComments.createdAt)],
          with: {
            user: true,
            replies: {
              where: eq(videoComments.isHidden, false),
              with: { user: true },
            },
          },
        },
        watches: true,
        engagements: true,
        playlistEntries: true,
      },
    });
  }

  async getActiveVideos(): Promise<Video[]> {
    return await db.query.videos.findMany({
      where: eq(videos.status, VideoStatusEnum.ACTIVE),
      orderBy: [desc(videos.createdAt)],
    });
  }

  async getSponsoredVideos(): Promise<Video[]> {
    return await db.query.videos.findMany({
      where: and(
        eq(videos.isSponsored, true),
        eq(videos.status, VideoStatusEnum.ACTIVE),
      ),
      orderBy: [desc(videos.createdAt)],
    });
  }

  async getVideosByDifficulty(difficulty: VideoDifficulty): Promise<Video[]> {
    return await db.query.videos.findMany({
      where: and(
        eq(videos.difficulty, difficulty),
        eq(videos.status, VideoStatusEnum.ACTIVE),
      ),
      orderBy: [desc(videos.createdAt)],
    });
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
  }): Promise<{ videos: Video[]; total: number }> {
    const conditions = [];
    if (filters.category)
      conditions.push(eq(videos.category, filters.category));
    if (filters.status) conditions.push(eq(videos.status, filters.status));
    if (filters.difficulty)
      conditions.push(eq(videos.difficulty, filters.difficulty));
    if (filters.isSponsored !== undefined)
      conditions.push(eq(videos.isSponsored, filters.isSponsored));

    if (filters.search) {
      conditions.push(
        or(
          like(videos.title, `%${filters.search}%`),
          like(videos.description, `%${filters.search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = ((filters.page || 1) - 1) * (filters.limit || 20);

    let items = await db.query.videos.findMany({
      where: whereClause,
      limit: filters.limit || 20,
      offset: offset,
      orderBy: [desc(videos.createdAt)],
    });

    if (filters.tag) {
      const taggedVideos = await db
        .select({ videoId: videoTags.videoId })
        .from(videoTags)
        .where(eq(videoTags.tag, filters.tag));
      const videoIds = taggedVideos.map((v) => v.videoId);
      items = items.filter((video) => videoIds.includes(video.id));
    }

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(whereClause);

    return { videos: items, total: Number(totalResult[0]?.count ?? 0) };
  }

  async update(
    id: string,
    data: Partial<NewVideo>,
  ): Promise<Video | undefined> {
    const [updated] = await db
      .update(videos)
      .set({
        ...data,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videos.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async incrementViews(id: string): Promise<void> {
    await db
      .update(videos)
      .set({
        views: sql`${videos.views} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videos.id, id));
  }

  async incrementWatchTime(id: string, seconds: number): Promise<void> {
    await db
      .update(videos)
      .set({
        watchTime: sql`${videos.watchTime} + ${seconds}`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videos.id, id));
  }

  async updateEngagementMetrics(id: string): Promise<void> {
    const engagements = await db
      .select({
        type: videoEngagements.type,
        count: sql<number>`count(*)`,
      })
      .from(videoEngagements)
      .where(eq(videoEngagements.videoId, id))
      .groupBy(videoEngagements.type);

    const metrics = { likes: 0, dislikes: 0, shares: 0, saves: 0 };

    for (const engagement of engagements) {
      if (engagement.type === 'like') metrics.likes = Number(engagement.count);
      if (engagement.type === 'dislike')
        metrics.dislikes = Number(engagement.count);
      if (engagement.type === 'share')
        metrics.shares = Number(engagement.count);
      if (engagement.type === 'save') metrics.saves = Number(engagement.count);
    }

    await db
      .update(videos)
      .set({
        likes: metrics.likes,
        dislikes: metrics.dislikes,
        shares: metrics.shares,
        saves: metrics.saves,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videos.id, id));
  }

  async updateCompletionRate(id: string): Promise<void> {
    const watches = await db
      .select({ completed: videoWatches.completed })
      .from(videoWatches)
      .where(eq(videoWatches.videoId, id));

    if (watches.length === 0) return;

    const completed = watches.filter((w) => w.completed).length;
    const rate = (completed / watches.length) * 100;

    await db
      .update(videos)
      .set({
        completionRate: rate,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videos.id, id));
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    views: number;
    sponsored: number;
    averageCompletionRate: number;
  }> {
    const [total, active, views, sponsored, completionRate] = await Promise.all(
      [
        db.select({ count: sql<number>`count(*)` }).from(videos),
        db
          .select({ count: sql<number>`count(*)` })
          .from(videos)
          .where(eq(videos.status, VideoStatusEnum.ACTIVE)),
        db.select({ sum: sql<number>`sum(${videos.views})` }).from(videos),
        db
          .select({ count: sql<number>`count(*)` })
          .from(videos)
          .where(eq(videos.isSponsored, true)),
        db
          .select({ avg: sql<number>`avg(${videos.completionRate})` })
          .from(videos),
      ],
    );
    return {
      total: Number(total[0]?.count ?? 0),
      active: Number(active[0]?.count ?? 0),
      views: Number(views[0]?.sum ?? 0),
      sponsored: Number(sponsored[0]?.count ?? 0),
      averageCompletionRate: Number(completionRate[0]?.avg ?? 0),
    };
  }

  async getPopularVideos(limit: number = 10): Promise<Video[]> {
    return await db.query.videos.findMany({
      where: eq(videos.status, VideoStatusEnum.ACTIVE),
      orderBy: [desc(videos.views)],
      limit: limit,
    });
  }

  async getTrendingVideos(limit: number = 10): Promise<Video[]> {
    const videosList = await db.query.videos.findMany({
      where: eq(videos.status, VideoStatusEnum.ACTIVE),
      limit: limit * 2,
    });

    return videosList
      .map((v) => ({
        ...v,
        engagementScore:
          ((v.likes + v.shares + v.saves) / (v.views || 1)) * 100,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);
  }
}

export const videosRepository = new VideosRepository();
