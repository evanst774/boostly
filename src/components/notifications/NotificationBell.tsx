// src/components/notifications/NotificationBell.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, BellDot } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, notifications, markAsRead, markAllAsRead } =
    useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(
          'relative w-9 h-9 rounded-xl border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-all',
          className,
        )}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellDot size={17} className="text-[#2563EB]" />
        ) : (
          <Bell size={17} className="text-[#6B7280]" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl shadow-xl border border-[#F3F4F6] overflow-hidden z-50">
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
