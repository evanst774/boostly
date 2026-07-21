// src/lib/notifications/repository.ts

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema/notifications';
import { eq, and, desc, sql } from 'drizzle-orm';
import type {
  Notification,
  NewNotification,
  NotificationFilters,
  NotificationStats,
} from './types';

export class NotificationsRepository {
  // ─── Create ────────────────────────────────────────────
  async create(data: NewNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        id: crypto.randomUUID(),
        title: data.title,
        message: data.message,
        userId: data.userId,
        type: data.type || 'INFO',
        isRead: false,
        link: data.link || null,
        linkText: data.linkText || null,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        createdAt: new Date().toISOString(),
      })
      .returning();
    return notification;
  }

  async createMany(data: NewNotification[]): Promise<Notification[]> {
    const results: Notification[] = [];
    for (const item of data) {
      const [notification] = await db
        .insert(notifications)
        .values({
          id: crypto.randomUUID(),
          title: item.title,
          message: item.message,
          userId: item.userId,
          type: item.type || 'INFO',
          isRead: false,
          link: item.link || null,
          linkText: item.linkText || null,
          entityType: item.entityType || null,
          entityId: item.entityId || null,
          createdAt: new Date().toISOString(),
        })
        .returning();
      results.push(notification);
    }
    return results;
  }

  // ─── Read ───────────────────────────────────────────────
  async getById(id: string): Promise<Notification | undefined> {
    return await db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
  }

  async getUserNotifications(
    userId: string,
    filters?: NotificationFilters,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const conditions = [eq(notifications.userId, userId)];

    if (filters?.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, filters.isRead));
    }
    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const [items, totalResult] = await Promise.all([
      db.query.notifications.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(notifications.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(whereClause),
    ]);

    return {
      notifications: items,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return Number(result[0]?.count ?? 0);
  }

  async getUnreadNotifications(
    userId: string,
    limit?: number,
  ): Promise<Notification[]> {
    return await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
      limit: limit || 10,
      orderBy: [desc(notifications.createdAt)],
    });
  }

  async getStats(userId: string): Promise<NotificationStats> {
    const [total, unread] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        ),
    ]);

    const totalCount = Number(total[0]?.count ?? 0);
    const unreadCount = Number(unread[0]?.count ?? 0);

    return {
      total: totalCount,
      unread: unreadCount,
      read: totalCount - unreadCount,
    };
  }

  // ─── Update ─────────────────────────────────────────────
  async markAsRead(id: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .returning();

    return result.length;
  }

  // ─── Delete ─────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteAllForUser(userId: string): Promise<number> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.userId, userId))
      .returning();
    return result.length;
  }

  async deleteOldNotifications(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db
      .delete(notifications)
      .where(sql`${notifications.createdAt} < ${cutoffDate.toISOString()}`)
      .returning();

    return result.length;
  }
}

export const notificationsRepository = new NotificationsRepository();
