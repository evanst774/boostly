// src/app/admin/components/ContentStatsWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { FileText, Newspaper, Star, Eye } from 'lucide-react';
import Link from 'next/link';

interface ContentStats {
  pages: { total: number; published: number };
  news: { total: number; published: number };
  testimonials: { total: number; published: number };
  totalViews: number;
}

export default function ContentStatsWidget() {
  const { dark } = useTheme();
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pagesRes, newsRes, testimonialsRes, viewsRes] =
          await Promise.all([
            fetch('/api/admin/content/pages/stats'),
            fetch('/api/admin/content/news/stats'),
            fetch('/api/admin/content/testimonials/stats'),
            fetch('/api/admin/analytics/views'),
          ]);

        const pagesData = await pagesRes.json();
        const newsData = await newsRes.json();
        const testimonialsData = await testimonialsRes.json();
        const viewsData = await viewsRes.json();

        setStats({
          pages: {
            total: pagesData.total || 0,
            published: pagesData.published || 0,
          },
          news: {
            total: newsData.total || 0,
            published: newsData.published || 0,
          },
          testimonials: {
            total: testimonialsData.total || 0,
            published: testimonialsData.published || 0,
          },
          totalViews: viewsData.totalViews || 0,
        });
      } catch (error) {
        console.error('Error fetching content stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cardBg = dark ? '#1e2333' : '#ffffff';
  const cardBorder = dark ? '#252c3d' : '#e2e8f0';
  const textPrimary = dark ? '#e8eaf2' : '#1f2937';
  // Fixed: Removed unused textMuted variable
  // const textMuted = dark ? '#8b92a5' : '#64748b';

  if (isLoading) {
    return (
      <div
        className="rounded-xl p-4"
        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Pages',
      value: stats?.pages.total || 0,
      published: stats?.pages.published || 0,
      icon: FileText,
      href: '/admin/content?tab=pages',
      color: '#4f6ef7',
    },
    {
      label: 'News',
      value: stats?.news.total || 0,
      published: stats?.news.published || 0,
      icon: Newspaper,
      href: '/admin/content?tab=news',
      color: '#22c55e',
    },
    {
      label: 'Testimonials',
      value: stats?.testimonials.total || 0,
      published: stats?.testimonials.published || 0,
      icon: Star,
      href: '/admin/content?tab=testimonials',
      color: '#a78bfa',
    },
  ];

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
          Content Overview
        </h3>
        <Link
          href="/admin/content"
          className="text-xs hover:underline"
          style={{ color: '#4f6ef7' }}
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.color}20` }}
                >
                  <Icon size={12} style={{ color: item.color }} />
                </div>
                <span className="text-sm" style={{ color: textPrimary }}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: textPrimary }}
                >
                  {item.value}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: '#22c55e20', color: '#22c55e' }}
                >
                  {item.published} published
                </span>
              </div>
            </Link>
          );
        })}

        <div className="border-t pt-2 mt-2" style={{ borderColor: cardBorder }}>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#f59e0b20' }}
              >
                <Eye size={12} style={{ color: '#f59e0b' }} />
              </div>
              <span className="text-sm" style={{ color: textPrimary }}>
                Total Views
              </span>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: textPrimary }}
            >
              {(stats?.totalViews || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
