// src/hooks/useNotifications.ts

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Notification,
  NotificationStats,
} from '@/lib/notifications/types';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useNotifications(limit: number = 20): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(
    async (reset: boolean = true) => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const currentOffset = reset ? 0 : offset;
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
        });

        const [notificationsRes, unreadRes, statsRes] = await Promise.all([
          fetch(`/api/notifications?${params}`),
          fetch('/api/notifications/unread'),
          fetch('/api/notifications/stats'),
        ]);

        const notificationsData = await notificationsRes.json();
        const unreadData = await unreadRes.json();
        const statsData = await statsRes.json();

        if (reset) {
          setNotifications(notificationsData.notifications || []);
          setOffset(limit);
        } else {
          setNotifications((prev) => [
            ...prev,
            ...(notificationsData.notifications || []),
          ]);
          setOffset(currentOffset + limit);
        }

        setHasMore((notificationsData.notifications || []).length === limit);
        setUnreadCount(unreadData.count || 0);
        setStats(statsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch notifications'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user, limit, offset],
  );

  // ─── Mark as read ──────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update stats
      setStats((prev) =>
        prev
          ? {
              ...prev,
              unread: Math.max(0, prev.unread - 1),
              read: prev.read + 1,
            }
          : null,
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // ─── Mark all as read ──────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Update stats
      setStats((prev) =>
        prev
          ? {
              ...prev,
              unread: 0,
              read: prev.total,
            }
          : null,
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // ─── Delete notification ──────────────────────────────
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete notification');

        // Update local state
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));

        // Update counts if it was unread
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  total: prev.total - 1,
                  unread: Math.max(0, prev.unread - 1),
                }
              : null,
          );
        } else {
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  total: prev.total - 1,
                }
              : null,
          );
        }
      } catch (err) {
        console.error('Failed to delete notification:', err);
      }
    },
    [notifications],
  );

  // ─── Refresh ───────────────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // ─── Load more ─────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchNotifications(false);
  }, [fetchNotifications, hasMore, isLoading]);

  // ─── Initial fetch ────────────────────────────────────
  // Now includes fetchNotifications in dependencies
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
    }
  }, [user, fetchNotifications]); // Added fetchNotifications to dependencies

  return {
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
  };
}
