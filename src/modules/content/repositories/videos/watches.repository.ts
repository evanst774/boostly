// src/modules/content/repositories/videos/watches.repository.ts
import { db } from '@/lib/db';
import {
  videoWatches,
  type VideoWatch,
  type NewVideoWatch,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export class VideoWatchesRepository {
  async create(data: NewVideoWatch): Promise<VideoWatch> {
    const [watch] = await db
      .insert(videoWatches)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return watch;
  }

  async getById(id: string): Promise<VideoWatch | undefined> {
    return await db.query.videoWatches.findFirst({
      where: eq(videoWatches.id, id),
      with: { video: true },
    });
  }

  async getByUserAndVideo(
    userId: string,
    videoId: string,
  ): Promise<VideoWatch | undefined> {
    return await db.query.videoWatches.findFirst({
      where: and(
        eq(videoWatches.userId, userId),
        eq(videoWatches.videoId, videoId),
      ),
    });
  }

  async updateProgress(
    id: string,
    data: Partial<NewVideoWatch>,
  ): Promise<VideoWatch | undefined> {
    const [updated] = await db
      .update(videoWatches)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(videoWatches.id, id))
      .returning();
    return updated;
  }

  async getUserCompletedVideos(userId: string): Promise<VideoWatch[]> {
    return await db.query.videoWatches.findMany({
      where: and(
        eq(videoWatches.userId, userId),
        eq(videoWatches.completed, true),
      ),
      with: { video: true },
      orderBy: [desc(videoWatches.completedAt)],
    });
  }

  async getTodayWatches(userId: string): Promise<VideoWatch[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.query.videoWatches.findMany({
      where: and(
        eq(videoWatches.userId, userId),
        sql`date(${videoWatches.createdAt}) = ${today}`,
      ),
    });
  }

  async getDailyEarnings(userId: string, date: string): Promise<number> {
    const result = await db
      .select({ sum: sql<number>`sum(${videoWatches.rewardAmount})` })
      .from(videoWatches)
      .where(
        and(
          eq(videoWatches.userId, userId),
          eq(videoWatches.rewardClaimed, true),
          sql`date(${videoWatches.completedAt}) = ${date}`,
        ),
      );
    return Number(result[0]?.sum ?? 0);
  }

  async getUserWatches(userId: string, limit?: number): Promise<VideoWatch[]> {
    return await db.query.videoWatches.findMany({
      where: eq(videoWatches.userId, userId),
      with: { video: true },
      limit: limit,
      orderBy: [desc(videoWatches.createdAt)],
    });
  }

  async getWatchCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoWatches)
      .where(eq(videoWatches.userId, userId));
    return Number(result[0]?.count ?? 0);
  }

  async getWatchTime(userId: string): Promise<number> {
    const result = await db
      .select({ sum: sql<number>`sum(${videoWatches.watchDuration})` })
      .from(videoWatches)
      .where(eq(videoWatches.userId, userId));
    return Number(result[0]?.sum ?? 0);
  }

  async getCompletedCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoWatches)
      .where(
        and(eq(videoWatches.userId, userId), eq(videoWatches.completed, true)),
      );
    return Number(result[0]?.count ?? 0);
  }

  async getVideoCompletionRate(videoId: string): Promise<number> {
    const watches = await db
      .select({ completed: videoWatches.completed })
      .from(videoWatches)
      .where(eq(videoWatches.videoId, videoId));

    if (watches.length === 0) return 0;
    const completed = watches.filter((w) => w.completed).length;
    return (completed / watches.length) * 100;
  }

  async getTopWatchedVideos(
    limit: number = 10,
  ): Promise<{ videoId: string; count: number }[]> {
    const results = await db
      .select({
        videoId: videoWatches.videoId,
        count: sql<number>`count(*)`,
      })
      .from(videoWatches)
      .groupBy(videoWatches.videoId)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);

    return results.map((r) => ({ videoId: r.videoId, count: Number(r.count) }));
  }
}

export const videoWatchesRepository = new VideoWatchesRepository();
