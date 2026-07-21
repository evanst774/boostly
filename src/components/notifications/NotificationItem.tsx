// src/components/notifications/NotificationItem.tsx

'use client';

import { formatDistanceToNow } from 'date-fns';
import { NotificationTypeColors, NotificationTypeIcons } from '@/lib/notifications/types';
import type { Notification } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const type = notification.type ?? 'INFO';
  const colorClasses = NotificationTypeColors[type] || NotificationTypeColors.INFO;
  const icon = NotificationTypeIcons[type] || 'ℹ️';

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#F8FAFC] border-b border-[#F3F4F6] last:border-b-0',
        !notification.isRead && 'bg-[#EFF6FF]/30 hover:bg-[#EFF6FF]/50',
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg',
        colorClasses,
      )}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[#111827] truncate">
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-[#6B7280] line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-[#9CA3AF]">{timeAgo}</span>
          {notification.linkText && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#9CA3AF]" />
              <span className="text-xs font-medium text-[#2563EB] hover:underline">
                {notification.linkText}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Unread indicator dot */}
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0 mt-2" />
      )}
    </div>
  );
}