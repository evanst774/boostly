// src/modules/content/repositories/videos/engagements.repository.ts
import { db } from '@/lib/db';
import {
  videoEngagements,
  type VideoEngagement,
  type NewVideoEngagement,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { videosRepository } from './videos.repository';

export class VideoEngagementsRepository {
  async create(data: NewVideoEngagement): Promise<VideoEngagement> {
    const [engagement] = await db
      .insert(videoEngagements)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return engagement;
  }

  async getByUserAndVideo(
    userId: string,
    videoId: string,
  ): Promise<VideoEngagement[]> {
    return await db.query.videoEngagements.findMany({
      where: and(
        eq(videoEngagements.userId, userId),
        eq(videoEngagements.videoId, videoId),
      ),
    });
  }

  async getByUserAndType(
    userId: string,
    type: 'like' | 'dislike' | 'share' | 'save',
  ): Promise<VideoEngagement[]> {
    return await db.query.videoEngagements.findMany({
      where: and(
        eq(videoEngagements.userId, userId),
        eq(videoEngagements.type, type),
      ),
    });
  }

  async toggleEngagement(
    userId: string,
    videoId: string,
    type: 'like' | 'dislike' | 'share' | 'save',
  ): Promise<{ action: 'added' | 'removed'; engagement?: VideoEngagement }> {
    const existing = await db.query.videoEngagements.findFirst({
      where: and(
        eq(videoEngagements.userId, userId),
        eq(videoEngagements.videoId, videoId),
        eq(videoEngagements.type, type),
      ),
    });

    if (existing) {
      await db
        .delete(videoEngagements)
        .where(eq(videoEngagements.id, existing.id));
      await videosRepository.updateEngagementMetrics(videoId);
      return { action: 'removed' };
    } else {
      const [engagement] = await db
        .insert(videoEngagements)
        .values({
          id: crypto.randomUUID(),
          userId,
          videoId,
          type,
        })
        .returning();
      await videosRepository.updateEngagementMetrics(videoId);
      return { action: 'added', engagement };
    }
  }

  async getEngagementStats(videoId: string): Promise<{
    likes: number;
    dislikes: number;
    shares: number;
    saves: number;
    total: number;
  }> {
    const results = await db
      .select({
        type: videoEngagements.type,
        count: sql<number>`count(*)`,
      })
      .from(videoEngagements)
      .where(eq(videoEngagements.videoId, videoId))
      .groupBy(videoEngagements.type);

    const stats = { likes: 0, dislikes: 0, shares: 0, saves: 0, total: 0 };
    for (const r of results) {
      const count = Number(r.count);
      stats.total += count;
      if (r.type === 'like') stats.likes = count;
      if (r.type === 'dislike') stats.dislikes = count;
      if (r.type === 'share') stats.shares = count;
      if (r.type === 'save') stats.saves = count;
    }
    return stats;
  }

  async getUserEngagementCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoEngagements)
      .where(eq(videoEngagements.userId, userId));
    return Number(result[0]?.count ?? 0);
  }
}

export const videoEngagementsRepository = new VideoEngagementsRepository();
