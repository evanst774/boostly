// src/app/(dashboard)/notifications/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, ArrowLeft, BellOff, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/notifications/types';
import { useT } from '@/lib/i18n';
import { notifications as notificationsMsg } from '@/lib/i18n/messages/notifications';
import { common } from '@/lib/i18n/messages/common';

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const router = useRouter();
  const t = useT(notificationsMsg);
  const tc = useT(common);
  const [filter, setFilter] = useState<FilterType>('all');
  const {
    notifications,
    unreadCount,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
    loadMore,
  } = useNotifications(20);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="hidden lg:flex w-10 h-10 rounded-xl border border-[#F3F4F6] items-center justify-center hover:border-[#2563EB] transition-colors" aria-label={tc('back')}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-sm text-[#6B7280]">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#2563EB]">
              {stats.total}
            </p>
            <p className="text-xs text-[#6B7280]">{t('total')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#EF4444]">
              {stats.unread}
            </p>
            <p className="text-xs text-[#6B7280]">{t('unread')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#22C55E]">
              {stats.read}
            </p>
            <p className="text-xs text-[#6B7280]">{t('read')}</p>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4">
        <div className="flex gap-1 bg-[#F8FAFC] rounded-xl p-1">
          {[
            { value: 'all', label: t('all') },
            { value: 'unread', label: t('unreadCount', { count: unreadCount }) },
            { value: 'read', label: t('read') },
          ].map((option) => (
            <button
              key={option.value}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                filter === option.value
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]',
              )}
              onClick={() => setFilter(option.value as FilterType)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors text-sm font-medium flex items-center gap-2"
            >
              <CheckCheck size={16} />
              {t('markAllRead')}
            </button>
          )}
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
        {isLoading && filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#2563EB]" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
              <BellOff size={24} className="text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-medium text-[#6B7280]">
              {filter === 'all'
                ? t('none')
                : filter === 'unread'
                  ? t('caughtUp')
                  : t('noRead')}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {filter === 'unread' ? t('noUnread') : ''}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {notifications.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full py-3 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors text-sm font-medium text-[#6B7280] disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin inline" />
          ) : (
            t('loadMore')
          )}
        </button>
      )}
    </div>
  );
}
