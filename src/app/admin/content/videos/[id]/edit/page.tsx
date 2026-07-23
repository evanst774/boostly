// src/app/admin/content/videos/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Video,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Star,
  Clock,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'EDUCATION',
    difficulty: 'BEGINNER',
    duration: 0,
    videoUrl: '',
    thumbnailUrl: '',
    rewardAmount: 40,
    isSponsored: false,
    sponsorName: '',
    sponsorLogo: '',
    sponsorWebsite: '',
    tags: [] as string[],
    status: 'DRAFT',
  });
  const [tagInput, setTagInput] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch video function - wrapped in useCallback with videoId dependency
  const fetchVideo = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/content/videos/${videoId}`);
      const data = await response.json();
      const video = data.video;
      setFormData({
        title: video.title || '',
        description: video.description || '',
        category: video.category || 'EDUCATION',
        difficulty: video.difficulty || 'BEGINNER',
        duration: video.duration || 0,
        videoUrl: video.videoUrl || '',
        thumbnailUrl: video.thumbnailUrl || '',
        rewardAmount: video.rewardAmount || 40,
        isSponsored: video.isSponsored || false,
        sponsorName: video.sponsorName || '',
        sponsorLogo: video.sponsorLogo || '',
        sponsorWebsite: video.sponsorWebsite || '',
        tags: video.tags || [],
        status: video.status || 'DRAFT',
      });
    } catch (error) {
      console.error('Failed to fetch video:', error);
      setMessage({ type: 'error', text: 'Failed to load video data' });
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  // Fetch video on mount - now includes fetchVideo in dependencies
  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/content/videos/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update video');
      }

      setMessage({ type: 'success', text: 'Video updated successfully!' });
      setTimeout(() => router.push(`/admin/content/videos/${videoId}`), 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update video',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/content/videos/${videoId}`, { method: 'DELETE' });
      router.push('/admin/content/videos');
    } catch (error) {
      console.error('Failed to delete video:', error);
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const categories = [
    'BUSINESS',
    'FINANCE',
    'TECH',
    'EDUCATION',
    'ENTERTAINMENT',
    'LIFESTYLE',
    'GAMING',
    'SPORTS',
    'MUSIC',
    'NEWS',
    'TUTORIAL',
  ];

  const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const statuses = [
    'DRAFT',
    'PENDING_REVIEW',
    'ACTIVE',
    'INACTIVE',
    'REJECTED',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#2563EB]" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-outfit text-center">
            Loading video...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/admin/content/videos/${videoId}`)}
            className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
          >
            <ArrowLeft
              size={20}
              className="text-[#64748B] dark:text-[#94A3B8]"
            />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
              Edit Video
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Update video content and settings
            </p>
          </div>
        </div>
        <button
          onClick={() => setDeleteDialogOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-[#DC2626] transition-colors flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Video
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Title *
              </label>
              <div className="relative">
                <Video
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="Enter video title"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white resize-none h-24"
              placeholder="Enter video description"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Video URL *
              </label>
              <input
                type="url"
                required
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Thumbnail URL
              </label>
              <div className="relative">
                <ImageIcon
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnailUrl: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
            </div>
          </div>

          {/* Duration & Reward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Duration (seconds)
              </label>
              <div className="relative">
                <Clock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="120"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Reward Amount *
              </label>
              <div className="relative">
                <DollarSign
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="number"
                  required
                  value={formData.rewardAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rewardAmount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="40"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Difficulty & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sponsored */}
          <div className="flex items-center gap-3 py-4 border-t border-b border-[#F1F5F9] dark:border-[#334155]">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, isSponsored: !formData.isSponsored })
              }
              className={cn(
                'w-12 h-7 rounded-full transition-colors relative',
                formData.isSponsored ? 'bg-[#F59E0B]' : 'bg-[#D1D5DB]',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                  formData.isSponsored ? 'right-0.5' : 'left-0.5',
                )}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-[#0F172A] dark:text-white flex items-center gap-2">
                <Star size={16} className="text-[#F59E0B]" />
                Sponsored Content
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Mark this video as sponsored content
              </p>
            </div>
          </div>

          {/* Sponsor Info */}
          {formData.isSponsored && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#FFFBEB] dark:bg-[#F59E0B]/5 rounded-xl border border-[#FDE68A] dark:border-[#F59E0B]/20">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                  Sponsor Name
                </label>
                <input
                  type="text"
                  value={formData.sponsorName}
                  onChange={(e) =>
                    setFormData({ ...formData, sponsorName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="Sponsor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                  Sponsor Logo URL
                </label>
                <input
                  type="url"
                  value={formData.sponsorLogo}
                  onChange={(e) =>
                    setFormData({ ...formData, sponsorLogo: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                  Sponsor Website
                </label>
                <input
                  type="url"
                  value={formData.sponsorWebsite}
                  onChange={(e) =>
                    setFormData({ ...formData, sponsorWebsite: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="https://sponsor.com"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
              Tags
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Tag
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addTag())
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="Enter tag and press Enter"
                />
              </div>
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#F8FAFC] dark:bg-[#334155] text-sm text-[#0F172A] dark:text-white border border-[#F1F5F9] dark:border-[#334155]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-[#EF4444] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Preview */}
          {formData.thumbnailUrl && (
            <div className="mt-4 p-4 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#F1F5F9] dark:border-[#334155]">
              <p className="text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                Thumbnail Preview
              </p>
              <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden bg-[#F1F5F9] dark:bg-[#334155]">
                <Image
                  src={formData.thumbnailUrl}
                  alt="Video thumbnail preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 320px) 100vw, 320px"
                  unoptimized={formData.thumbnailUrl.startsWith('data:')}
                />
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={cn(
                'p-3 rounded-xl flex items-center gap-2 text-sm',
                message.type === 'success'
                  ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                  : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
              )}
            >
              {message.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#F1F5F9] dark:border-[#334155]">
            <button
              type="button"
              onClick={() => router.push(`/admin/content/videos/${videoId}`)}
              className="px-6 py-2.5 rounded-xl border border-[#F1F5F9] dark:border-[#334155] text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

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
        onConfirm={handleDelete}
        variant="delete"
        isLoading={isSubmitting}
      />
    </div>
  );
}
