// src/app/(dashboard)/notifications/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, ArrowLeft, BellOff, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/notifications/types';

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const router = useRouter();
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
          className="w-10 h-10 rounded-xl border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          <p className="text-sm text-[#6B7280]">
            Stay updated with your activity
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
            <p className="text-xs text-[#6B7280]">Total</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#EF4444]">
              {stats.unread}
            </p>
            <p className="text-xs text-[#6B7280]">Unread</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#22C55E]">
              {stats.read}
            </p>
            <p className="text-xs text-[#6B7280]">Read</p>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4">
        <div className="flex gap-1 bg-[#F8FAFC] rounded-xl p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread (${unreadCount})` },
            { value: 'read', label: 'Read' },
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
              Mark all read
            </button>
          )}
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
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
                ? 'No notifications'
                : filter === 'unread'
                  ? 'All caught up!'
                  : 'No read notifications'}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {filter === 'unread' ? 'You have no unread notifications' : ''}
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
            'Load More'
          )}
        </button>
      )}
    </div>
  );
}
