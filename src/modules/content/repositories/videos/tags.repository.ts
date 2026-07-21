// src/modules/content/repositories/videos/tags.repository.ts
import { db } from '@/lib/db';
import { videoTags, type VideoTag, type NewVideoTag } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export class VideoTagsRepository {
  async create(data: NewVideoTag): Promise<VideoTag> {
    const [tag] = await db
      .insert(videoTags)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return tag;
  }

  async createMany(tags: string[], videoId: string): Promise<VideoTag[]> {
    const values = tags.map((tag) => ({
      id: crypto.randomUUID(),
      videoId,
      tag: tag.trim().toLowerCase(),
    }));

    const inserted = await db.insert(videoTags).values(values).returning();
    return inserted;
  }

  async getByVideoId(videoId: string): Promise<VideoTag[]> {
    return await db.query.videoTags.findMany({
      where: eq(videoTags.videoId, videoId),
      orderBy: [videoTags.tag],
    });
  }

  async getPopularTags(
    limit: number = 20,
  ): Promise<{ tag: string; count: number }[]> {
    const results = await db
      .select({
        tag: videoTags.tag,
        count: sql<number>`count(*)`,
      })
      .from(videoTags)
      .groupBy(videoTags.tag)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);

    return results.map((r) => ({ tag: r.tag, count: Number(r.count) }));
  }

  async deleteByVideoId(videoId: string): Promise<void> {
    await db.delete(videoTags).where(eq(videoTags.videoId, videoId));
  }

  async deleteTag(id: string): Promise<void> {
    await db.delete(videoTags).where(eq(videoTags.id, id));
  }

  async getVideosByTag(tag: string): Promise<string[]> {
    const results = await db
      .select({ videoId: videoTags.videoId })
      .from(videoTags)
      .where(eq(videoTags.tag, tag.toLowerCase()));
    return results.map((r) => r.videoId);
  }
}

export const videoTagsRepository = new VideoTagsRepository();
