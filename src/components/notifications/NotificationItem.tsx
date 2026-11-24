// src/components/notifications/NotificationItem.tsx

'use client';

import { Info } from 'lucide-react';
import { NotificationTypeColors, NotificationTypeIcons } from '@/lib/notifications/types';
import type { Notification } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import { LOCALE_TAGS, useLocale, useT, type Locale } from '@/lib/i18n';
import { notifications as notificationsMsg } from '@/lib/i18n/messages/notifications';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

/** "5 minutes ago" / "il y a 5 minutes" / "dakika 5 zilizopita". */
function timeAgo(date: Date, locale: Locale, justNow: string) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return justNow;
}

/** Older notifications were saved with an emoji prefix; the type icon replaces it. */
function stripLeadingEmoji(title: string) {
  return title.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '');
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const t = useT(notificationsMsg);
  const { locale } = useLocale();
  const type = notification.type ?? 'INFO';
  const colorClasses = NotificationTypeColors[type] || NotificationTypeColors.INFO;
  const Icon = NotificationTypeIcons[type] || Info;

  const ago = timeAgo(new Date(notification.createdAt), locale, t('justNow'));

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
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[#111827] truncate">
            {stripLeadingEmoji(notification.title)}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-[#6B7280] line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-[#9CA3AF]">{ago}</span>
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