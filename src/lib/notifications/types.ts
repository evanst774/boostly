// src/lib/notifications/types.ts

import { NotificationTypeEnum } from '@/lib/db/schema/notifications';

export type NotificationType =
  (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const NotificationTypeColors: Record<NotificationType, string> = {
  INFO: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  WARNING: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  SUCCESS: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
  ERROR: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
  REMINDER: 'bg-[#F5F3FF] text-[#6D28D9] border-[#EDE9FE]',
};

export const NotificationTypeIcons: Record<NotificationType, string> = {
  INFO: 'ℹ️',
  WARNING: '⚠️',
  SUCCESS: '✅',
  ERROR: '❌',
  REMINDER: '🔔',
};

// ✅ Re-export from schema for consistency
export type {
  Notification,
  NewNotification,
} from '@/lib/db/schema/notifications';

export interface NotificationFilters {
  userId?: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}
