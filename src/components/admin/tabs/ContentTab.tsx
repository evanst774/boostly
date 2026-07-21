// src/components/admin/tabs/ContentTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ContentTab() {
  const router = useRouter();
  const [stats, setStats] = useState({ videos: 0, games: 0, surveys: 0 });

  useEffect(() => {
    fetchContentStats();
  }, []);

  const fetchContentStats = async () => {
    try {
      const response = await fetch('/api/admin/content/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch content stats:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: '📺',
            label: 'Videos',
            value: stats.videos,
            color: 'from-[#2563EB] to-[#1D4ED8]',
            href: '/admin/content/videos',
          },
          {
            icon: '🎮',
            label: 'Games',
            value: stats.games,
            color: 'from-[#22C55E] to-[#16A34A]',
            href: '/admin/content/games',
          },
          {
            icon: '📋',
            label: 'Surveys',
            value: stats.surveys,
            color: 'from-[#8B5CF6] to-[#6D28D9]',
            href: '/admin/content/surveys',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5 text-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(item.href)}
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <p className="text-2xl font-extrabold text-[#0F172A] dark:text-white">
              {item.value}
            </p>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Total {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: '📺',
              label: 'Add Video',
              desc: 'Upload new video',
              href: '/admin/content/videos/create',
              color:
                'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
            },
            {
              icon: '🎮',
              label: 'Add Game',
              desc: 'Add new game',
              href: '/admin/content/games/create',
              color:
                'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
            },
            {
              icon: '📋',
              label: 'Add Survey',
              desc: 'Create new survey',
              href: '/admin/content/surveys/create',
              color:
                'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]',
            },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 p-4 rounded-xl border border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] dark:hover:border-[#60A5FA] transition-colors text-left"
              onClick={() => router.push(item.href)}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                  item.color,
                )}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                  {item.label}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}