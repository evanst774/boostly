// src/lib/notifications/service.ts

import { notificationsRepository } from './repository';
import type {
  Notification,
  NewNotification,
  NotificationFilters,
  NotificationStats,
  NotificationType,
} from './types';
import { requireAuth } from '@/lib/db/auth-utils';

export class NotificationsService {
  // ─── Create ────────────────────────────────────────────
  async createNotification(data: NewNotification): Promise<Notification> {
    return await notificationsRepository.create(data);
  }

  async createNotificationForUser(
    userId: string,
    title: string,
    message: string,
    options?: {
      type?: NotificationType;
      link?: string;
      linkText?: string;
      entityType?: string;
      entityId?: string;
    },
  ): Promise<Notification> {
    return await notificationsRepository.create({
      userId,
      title,
      message,
      type: options?.type || 'INFO',
      link: options?.link,
      linkText: options?.linkText,
      entityType: options?.entityType,
      entityId: options?.entityId,
    });
  }

  async createNotificationsForUsers(
    userIds: string[],
    title: string,
    message: string,
    options?: {
      type?: NotificationType;
      link?: string;
      linkText?: string;
      entityType?: string;
      entityId?: string;
    },
  ): Promise<Notification[]> {
    const data = userIds.map((userId) => ({
      userId,
      title,
      message,
      type: options?.type || 'INFO',
      link: options?.link,
      linkText: options?.linkText,
      entityType: options?.entityType,
      entityId: options?.entityId,
    }));

    return await notificationsRepository.createMany(data);
  }

  // ─── Read ───────────────────────────────────────────────
  async getNotification(id: string): Promise<Notification | undefined> {
    return await notificationsRepository.getById(id);
  }

  async getUserNotifications(
    userId: string,
    filters?: NotificationFilters,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return await notificationsRepository.getUserNotifications(userId, filters);
  }

  async getMyNotifications(
    filters?: Omit<NotificationFilters, 'userId'>,
  ): Promise<{
    notifications: Notification[];
    total: number;
  }> {
    const user = await requireAuth();
    return await notificationsRepository.getUserNotifications(
      user.user.id,
      filters,
    );
  }

  async getUnreadCount(userId?: string): Promise<number> {
    const targetUserId = userId || (await requireAuth()).user.id;
    return await notificationsRepository.getUnreadCount(targetUserId);
  }

  async getMyUnreadCount(): Promise<number> {
    const user = await requireAuth();
    return await notificationsRepository.getUnreadCount(user.user.id);
  }

  async getUnreadNotifications(
    userId?: string,
    limit?: number,
  ): Promise<Notification[]> {
    const targetUserId = userId || (await requireAuth()).user.id;
    return await notificationsRepository.getUnreadNotifications(
      targetUserId,
      limit,
    );
  }

  async getMyStats(): Promise<NotificationStats> {
    const user = await requireAuth();
    return await notificationsRepository.getStats(user.user.id);
  }

  // ─── Update ─────────────────────────────────────────────
  async markAsRead(id: string): Promise<Notification | undefined> {
    const user = await requireAuth();
    const notification = await notificationsRepository.getById(id);

    if (!notification) throw new Error('Notification not found');
    if (notification.userId !== user.user.id) {
      throw new Error(
        'You do not have permission to mark this notification as read',
      );
    }

    return await notificationsRepository.markAsRead(id);
  }

  async markAllAsRead(): Promise<number> {
    const user = await requireAuth();
    return await notificationsRepository.markAllAsRead(user.user.id);
  }

  // ─── Delete ─────────────────────────────────────────────
  async deleteNotification(id: string): Promise<void> {
    const user = await requireAuth();
    const notification = await notificationsRepository.getById(id);

    if (!notification) throw new Error('Notification not found');
    if (notification.userId !== user.user.id) {
      throw new Error('You do not have permission to delete this notification');
    }

    await notificationsRepository.delete(id);
  }

  // ─── Admin ──────────────────────────────────────────────
  async getStatsForUser(userId: string): Promise<NotificationStats> {
    return await notificationsRepository.getStats(userId);
  }

  async cleanupOldNotifications(days: number = 30): Promise<number> {
    return await notificationsRepository.deleteOldNotifications(days);
  }

  // ─── System Notifications ──────────────────────────────

  async notifyRewardEarned(
    userId: string,
    amount: number,
    type: string,
    entityId?: string,
  ): Promise<Notification> {
    return await this.createNotificationForUser(
      userId,
      `💰 Reward Earned!`,
      `You earned ${amount.toLocaleString()} RWF from ${type.toLowerCase()}`,
      {
        type: 'SUCCESS',
        link: '/wallet',
        linkText: 'View Wallet',
        entityType: 'reward',
        entityId,
      },
    );
  }

  async notifyDailyBonusClaimed(
    userId: string,
    streakDay: number,
    amount: number,
  ): Promise<Notification> {
    return await this.createNotificationForUser(
      userId,
      `🎁 Daily Bonus Claimed!`,
      `You claimed ${amount.toLocaleString()} RWF for Day ${streakDay} of your streak!`,
      {
        type: 'SUCCESS',
        link: '/daily-bonus',
        linkText: 'View Streak',
        entityType: 'daily_bonus',
      },
    );
  }

  async notifyReferralSuccess(
    userId: string,
    friendName: string,
    amount: number,
  ): Promise<Notification> {
    return await this.createNotificationForUser(
      userId,
      `👥 Referral Success!`,
      `${friendName} joined using your code! You earned ${amount.toLocaleString()} RWF.`,
      {
        type: 'SUCCESS',
        link: '/referrals',
        linkText: 'View Referrals',
        entityType: 'referral',
      },
    );
  }

  async notifyWithdrawalStatus(
    userId: string,
    amount: number,
    status: 'approved' | 'completed' | 'failed' | 'rejected',
    reason?: string,
  ): Promise<Notification> {
    const messages = {
      approved: `Your withdrawal of ${amount.toLocaleString()} RWF has been approved and is being processed.`,
      completed: `Your withdrawal of ${amount.toLocaleString()} RWF has been completed!`,
      failed: `Your withdrawal of ${amount.toLocaleString()} RWF failed. ${reason || 'Please try again.'}`,
      rejected: `Your withdrawal of ${amount.toLocaleString()} RWF was rejected. ${reason || 'Please contact support.'}`,
    };

    const types = {
      approved: 'INFO' as NotificationType,
      completed: 'SUCCESS' as NotificationType,
      failed: 'ERROR' as NotificationType,
      rejected: 'WARNING' as NotificationType,
    };

    return await this.createNotificationForUser(
      userId,
      `💸 Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      messages[status],
      {
        type: types[status],
        link: '/wallet',
        linkText: 'View Wallet',
        entityType: 'withdrawal',
      },
    );
  }

  async notifyBadgePurchased(
    userId: string,
    badgeName: string,
    boost: number,
  ): Promise<Notification> {
    return await this.createNotificationForUser(
      userId,
      `🏅 Badge Unlocked!`,
      `You purchased the ${badgeName}! Your earnings are now boosted by ${boost}%.`,
      {
        type: 'SUCCESS',
        link: '/badges',
        linkText: 'View Badges',
        entityType: 'badge',
      },
    );
  }

  async notifySubscriptionStatus(
    userId: string,
    planName: string,
    status: 'activated' | 'renewed' | 'expired' | 'cancelled',
  ): Promise<Notification> {
    const messages = {
      activated: `Your ${planName} subscription is now active! Start earning daily rewards.`,
      renewed: `Your ${planName} subscription has been renewed successfully.`,
      expired: `Your ${planName} subscription has expired. Renew to continue earning.`,
      cancelled: `Your ${planName} subscription has been cancelled.`,
    };

    const types = {
      activated: 'SUCCESS' as NotificationType,
      renewed: 'SUCCESS' as NotificationType,
      expired: 'WARNING' as NotificationType,
      cancelled: 'INFO' as NotificationType,
    };

    return await this.createNotificationForUser(
      userId,
      `📋 Subscription ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      messages[status],
      {
        type: types[status],
        link: '/subscription',
        linkText: 'View Subscription',
        entityType: 'subscription',
      },
    );
  }

  async notifyVerificationSent(
    userId: string,
    email: string,
  ): Promise<Notification> {
    return await this.createNotificationForUser(
      userId,
      '📧 Verify Your Email',
      `We sent a verification link to ${email}. Please check your inbox.`,
      {
        type: 'INFO',
        link: `/verify-email?email=${encodeURIComponent(email)}`,
        linkText: 'Verify Now',
        entityType: 'auth',
      },
    );
  }

  async notifySystemMessage(
    userId: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    return await this.createNotificationForUser(userId, title, message, {
      type: 'INFO',
    });
  }
}

export const notificationsService = new NotificationsService();
