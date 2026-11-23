// src/app/admin/content/videos/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Video,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Award,
  Star,
  RefreshCw,
  Play,
  Heart,
  Clapperboard,
} from 'lucide-react';
import { cn, formatDate, formatDuration } from '@/lib/utils';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormSelect } from '@/components/ui/FormSelect';

interface VideoStats {
  total: number;
  active: number;
  views: number;
  sponsored: number;
  averageCompletionRate: number;
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  rewardAmount: number;
  isSponsored: boolean;
  sponsorName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED';
  views: number;
  watchTime: number;
  likes: number;
  dislikes: number;
  shares: number;
  saves: number;
  completionRate: number;
  createdAt: string;
  publishedAt?: string;
  tags?: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'REJECTED', label: 'Rejected' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'TECH', label: 'Tech' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'LIFESTYLE', label: 'Lifestyle' },
  { value: 'GAMING', label: 'Gaming' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'NEWS', label: 'News' },
  { value: 'TUTORIAL', label: 'Tutorial' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

export default function AdminVideosPage() {
  const router = useRouter();
  const { formatAmount } = useSystemCurrency();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (difficultyFilter !== 'all')
        params.append('difficulty', difficultyFilter);

      const response = await fetch(`/api/content/videos?${params}`);
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter, difficultyFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/content/videos/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch video stats:', error);
    }
  }, []);

  // Declared after the callbacks: referencing them earlier hits the TDZ.
  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, [fetchVideos, fetchStats]);

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/content/videos/${videoToDelete}`, { method: 'DELETE' });
      await fetchVideos();
      await fetchStats();
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('Failed to delete video:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await fetch(`/api/content/videos/${id}/publish`, { method: 'POST' });
      await fetchVideos();
      await fetchStats();
    } catch (error) {
      console.error('Failed to publish video:', error);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await fetch(`/api/content/videos/${id}/unpublish`, { method: 'POST' });
      await fetchVideos();
      await fetchStats();
    } catch (error) {
      console.error('Failed to unpublish video:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE:
        'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
      DRAFT:
        'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]',
      PENDING_REVIEW:
        'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
      REJECTED:
        'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
    };
    return (
      colors[status] ||
      'bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]'
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E]',
      INTERMEDIATE: 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B]',
      ADVANCED: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444]',
      EXPERT: 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6]',
    };
    return (
      colors[difficulty] || 'bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B]'
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#2563EB]" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-outfit text-center">
            Loading videos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Videos
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage all video content on the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/content/videos/create')}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Plus size={18} />
            Add Video
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Videos"
            value={stats.total}
            icon={<Video size={20} />}
            color="blue"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<CheckCircle size={20} />}
            color="green"
          />
          <StatCard
            label="Total Views"
            value={stats.views.toLocaleString()}
            icon={<Eye size={20} />}
            color="purple"
          />
          <StatCard
            label="Sponsored"
            value={stats.sponsored}
            icon={<Star size={20} />}
            color="yellow"
          />
        </div>
      )}

      {/* Filters with Radix UI Select */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] touch-min-target"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <FormSelect
          label="Status"
          name="status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          className="min-w-[150px]"
        />

        <FormSelect
          label="Category"
          name="category"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={CATEGORY_OPTIONS}
          className="min-w-[150px]"
        />

        <FormSelect
          label="Difficulty"
          name="difficulty"
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={DIFFICULTY_OPTIONS}
          className="min-w-[150px]"
        />

        <button
          onClick={() => {
            fetchVideos();
            fetchStats();
          }}
          className="px-4 py-2.5 rounded-xl border border-[#F1F5F9] dark:border-[#334155] text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors flex items-center gap-2 touch-min-target"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Video List - Fixed: Using next/image */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <Clapperboard size={56} className="mx-auto mb-4 text-[#94A3B8] dark:text-[#64748B]" />
            <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
              No videos found
            </p>
            <p className="text-sm text-[#94A3B8] dark:text-[#64748B] mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
            {videos.map((video) => (
              <div
                key={video.id}
                className="p-4 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors group"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Thumbnail - Fixed: Using next/image */}
                  <div
                    className="relative w-full sm:w-40 h-24 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex-shrink-0 overflow-hidden cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/content/videos/${video.id}`)
                    }
                  >
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        <Clapperboard size={28} className="text-white/70" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play size={18} className="text-[#2563EB] ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                    {video.isSponsored && (
                      <div className="absolute top-1 left-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
                        <Star size={8} className="fill-current" />
                        Sponsored
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                        {video.title}
                      </h3>
                      <span
                        className={cn(
                          'text-[9px] font-semibold px-2 py-0.5 rounded-full',
                          getDifficultyColor(video.difficulty),
                        )}
                      >
                        {video.difficulty}
                      </span>
                      {video.isSponsored && (
                        <span className="text-[9px] font-bold text-[#F59E0B] bg-[#FFFBEB] dark:bg-[#F59E0B]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Star size={10} className="fill-current" />
                          Sponsored
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {video.category}
                      </span>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                        <Eye size={12} />
                        {video.views.toLocaleString()} views
                      </span>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                        <Heart size={12} />
                        {video.likes}
                      </span>
                      <span className="text-xs font-bold text-[#22C55E] bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Award size={12} />+{formatAmount(video.rewardAmount)}
                      </span>
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {video.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#334155] px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {video.tags.length > 2 && (
                            <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8]">
                              +{video.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                      <span>{formatDate(video.createdAt)}</span>
                      {video.publishedAt && (
                        <>
                          <span>•</span>
                          <span>Published {formatDate(video.publishedAt)}</span>
                        </>
                      )}
                      {video.completionRate > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            Completion {Math.round(video.completionRate)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap',
                        getStatusColor(video.status),
                      )}
                    >
                      {video.status}
                    </span>
                    <button
                      className="p-1.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                      onClick={() =>
                        router.push(`/admin/content/videos/${video.id}`)
                      }
                      title="View Details"
                    >
                      <Eye
                        size={16}
                        className="text-[#64748B] dark:text-[#94A3B8]"
                      />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                      onClick={() =>
                        router.push(`/admin/content/videos/${video.id}/edit`)
                      }
                      title="Edit Video"
                    >
                      <Edit2
                        size={16}
                        className="text-[#64748B] dark:text-[#94A3B8]"
                      />
                    </button>
                    {video.status === 'DRAFT' && (
                      <button
                        className="p-1.5 rounded-lg hover:bg-[#F0FDF4] dark:hover:bg-[#22C55E]/20 transition-colors touch-min-target"
                        onClick={() => handlePublish(video.id)}
                        title="Publish"
                      >
                        <CheckCircle size={16} className="text-[#22C55E]" />
                      </button>
                    )}
                    {video.status === 'ACTIVE' && (
                      <button
                        className="p-1.5 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#EF4444]/20 transition-colors touch-min-target"
                        onClick={() => handleUnpublish(video.id)}
                        title="Unpublish"
                      >
                        <XCircle size={16} className="text-[#EF4444]" />
                      </button>
                    )}
                    <button
                      className="p-1.5 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors touch-min-target"
                      onClick={() => {
                        setVideoToDelete(video.id);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete Video"
                    >
                      <Trash2 size={16} className="text-[#EF4444]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Video"
        description={
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Are you sure you want to delete this video?
            </p>
            <p className="text-xs text-red-400/70">
              This action cannot be undone. All associated data will be
              permanently removed.
            </p>
          </div>
        }
        confirmText="Delete Video"
        cancelText="Cancel"
        onConfirm={handleDeleteVideo}
        variant="delete"
        isLoading={isSubmitting}
      />
    </div>
  );
}

// StatCard Component with proper typing
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors: Record<StatCardProps['color'], string> = {
    blue: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
    green:
      'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
    yellow:
      'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]',
    purple:
      'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]',
    red: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            colors[color],
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0F172A] dark:text-white">
            {value}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</p>
        </div>
      </div>
    </div>
  );
}
