// src/components/notifications/NotificationDropdown.tsx

'use client';

import { useRouter } from 'next/navigation';
import { CheckCheck, BellOff, ChevronRight } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '@/lib/notifications/types';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();

  const handleViewAll = () => {
    onClose();
    router.push('/notifications');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    if (notification.link) {
      onClose();
      router.push(notification.link);
    }
  };

  return (
    <div className="flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold text-white bg-[#EF4444] px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors flex items-center gap-1"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-3">
              <BellOff size={20} className="text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-medium text-[#6B7280]">All caught up!</p>
            <p className="text-xs text-[#9CA3AF] mt-1">No new notifications</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="flex-shrink-0 border-t border-[#F3F4F6]">
          <button
            onClick={handleViewAll}
            className="w-full py-3 text-sm font-medium text-[#2563EB] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-1"
          >
            View all notifications
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
