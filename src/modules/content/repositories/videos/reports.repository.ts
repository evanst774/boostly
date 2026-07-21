// src/modules/content/repositories/videos/reports.repository.ts
import { db } from '@/lib/db';
import {
  videoReports,
  type VideoReport,
  type NewVideoReport,
} from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export class VideoReportsRepository {
  async create(data: NewVideoReport): Promise<VideoReport> {
    const [report] = await db
      .insert(videoReports)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return report;
  }

  async getById(id: string): Promise<VideoReport | undefined> {
    return await db.query.videoReports.findFirst({
      where: eq(videoReports.id, id),
      with: { video: true, user: true, reviewer: true },
    });
  }

  async getByVideoId(videoId: string): Promise<VideoReport[]> {
    return await db.query.videoReports.findMany({
      where: eq(videoReports.videoId, videoId),
      with: { user: true },
      orderBy: [desc(videoReports.createdAt)],
    });
  }

  async getUserReports(userId: string): Promise<VideoReport[]> {
    return await db.query.videoReports.findMany({
      where: eq(videoReports.userId, userId),
      with: { video: true },
      orderBy: [desc(videoReports.createdAt)],
    });
  }

  async getPendingReports(limit?: number): Promise<VideoReport[]> {
    return await db.query.videoReports.findMany({
      where: eq(videoReports.status, 'pending'),
      with: { video: true, user: true },
      orderBy: [desc(videoReports.createdAt)],
      limit: limit,
    });
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken',
    reviewedBy: string,
  ): Promise<VideoReport | undefined> {
    const [updated] = await db
      .update(videoReports)
      .set({
        status,
        reviewedBy,
        reviewedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videoReports.id, id))
      .returning();
    return updated;
  }

  async getReportCount(videoId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoReports)
      .where(eq(videoReports.videoId, videoId));
    return Number(result[0]?.count ?? 0);
  }

  async getUserReportCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoReports)
      .where(eq(videoReports.userId, userId));
    return Number(result[0]?.count ?? 0);
  }

  async getReportStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    dismissed: number;
    actionTaken: number;
  }> {
    const [total, pending, reviewed, dismissed, actionTaken] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(videoReports),
        db
          .select({ count: sql<number>`count(*)` })
          .from(videoReports)
          .where(eq(videoReports.status, 'pending')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(videoReports)
          .where(eq(videoReports.status, 'reviewed')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(videoReports)
          .where(eq(videoReports.status, 'dismissed')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(videoReports)
          .where(eq(videoReports.status, 'action_taken')),
      ]);
    return {
      total: Number(total[0]?.count ?? 0),
      pending: Number(pending[0]?.count ?? 0),
      reviewed: Number(reviewed[0]?.count ?? 0),
      dismissed: Number(dismissed[0]?.count ?? 0),
      actionTaken: Number(actionTaken[0]?.count ?? 0),
    };
  }
}

export const videoReportsRepository = new VideoReportsRepository();
