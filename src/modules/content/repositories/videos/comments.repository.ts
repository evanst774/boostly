// src/modules/content/repositories/videos/comments.repository.ts
import { db } from '@/lib/db';
import {
  videoComments,
  type VideoComment,
  type NewVideoComment,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export class VideoCommentsRepository {
  async create(data: NewVideoComment): Promise<VideoComment> {
    const [comment] = await db
      .insert(videoComments)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return comment;
  }

  async getById(id: string): Promise<VideoComment | undefined> {
    return await db.query.videoComments.findFirst({
      where: eq(videoComments.id, id),
      with: {
        user: true,
        replies: {
          with: { user: true },
          where: eq(videoComments.isHidden, false),
        },
      },
    });
  }

  async getByVideoId(videoId: string, limit?: number): Promise<VideoComment[]> {
    return await db.query.videoComments.findMany({
      where: and(
        eq(videoComments.videoId, videoId),
        eq(videoComments.isHidden, false),
        sql`${videoComments.parentId} IS NULL`,
      ),
      with: {
        user: true,
        replies: {
          with: { user: true },
          where: eq(videoComments.isHidden, false),
          orderBy: [desc(videoComments.createdAt)],
          limit: 5,
        },
      },
      orderBy: [desc(videoComments.isPinned), desc(videoComments.createdAt)],
      limit: limit,
    });
  }

  async getReplies(commentId: string, limit?: number): Promise<VideoComment[]> {
    return await db.query.videoComments.findMany({
      where: and(
        eq(videoComments.parentId, commentId),
        eq(videoComments.isHidden, false),
      ),
      with: { user: true },
      orderBy: [desc(videoComments.createdAt)],
      limit: limit,
    });
  }

  async getUserComments(userId: string): Promise<VideoComment[]> {
    return await db.query.videoComments.findMany({
      where: and(
        eq(videoComments.userId, userId),
        eq(videoComments.isHidden, false),
      ),
      with: { video: true },
      orderBy: [desc(videoComments.createdAt)],
    });
  }

  async update(
    id: string,
    data: Partial<NewVideoComment>,
  ): Promise<VideoComment | undefined> {
    const [updated] = await db
      .update(videoComments)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(videoComments.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(videoComments).where(eq(videoComments.id, id));
  }

  async hide(id: string): Promise<VideoComment | undefined> {
    const [updated] = await db
      .update(videoComments)
      .set({
        isHidden: true,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videoComments.id, id))
      .returning();
    return updated;
  }

  async pin(id: string): Promise<VideoComment | undefined> {
    const [updated] = await db
      .update(videoComments)
      .set({
        isPinned: true,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videoComments.id, id))
      .returning();
    return updated;
  }

  async unpin(id: string): Promise<VideoComment | undefined> {
    const [updated] = await db
      .update(videoComments)
      .set({
        isPinned: false,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videoComments.id, id))
      .returning();
    return updated;
  }

  async incrementLikes(id: string): Promise<void> {
    await db
      .update(videoComments)
      .set({
        likes: sql`${videoComments.likes} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videoComments.id, id));
  }

  async decrementLikes(id: string): Promise<void> {
    await db
      .update(videoComments)
      .set({
        likes: sql`${videoComments.likes} - 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videoComments.id, id));
  }

  async getCommentCount(videoId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoComments)
      .where(
        and(
          eq(videoComments.videoId, videoId),
          eq(videoComments.isHidden, false),
        ),
      );
    return Number(result[0]?.count ?? 0);
  }
}

export const videoCommentsRepository = new VideoCommentsRepository();
