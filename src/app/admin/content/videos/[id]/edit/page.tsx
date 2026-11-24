// src/app/admin/content/videos/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  VideoForm,
  EMPTY_VIDEO_FORM,
  type VideoFormValues,
} from '@/components/admin/content/VideoForm';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'DRAFT' },
  { value: 'PENDING_REVIEW', label: 'PENDING_REVIEW' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' },
  { value: 'REJECTED', label: 'REJECTED' },
];

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialValues, setInitialValues] = useState<VideoFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch video function - wrapped in useCallback with videoId dependency
  const fetchVideo = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/content/videos/${videoId}`);
      const data = await response.json();
      const video = data.video;
      setInitialValues({
        ...EMPTY_VIDEO_FORM,
        title: video.title || '',
        description: video.description || '',
        category: video.category || 'EDUCATION',
        difficulty: video.difficulty || 'BEGINNER',
        duration: video.duration || 0,
        videoUrl: video.videoUrl || '',
        thumbnailUrl: video.thumbnailUrl || '',
        rewardAmount: video.rewardAmount || 40,
        rewardBudget: video.rewardBudget ?? null,
        isSponsored: video.isSponsored || false,
        sponsorName: video.sponsorName || '',
        sponsorLogo: video.sponsorLogo || '',
        sponsorWebsite: video.sponsorWebsite || '',
        tags: video.tags || [],
        status: video.status || 'DRAFT',
      });
    } catch (error) {
      console.error('Failed to fetch video:', error);
      setLoadError('Failed to load video data');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  // Fetch video on mount - now includes fetchVideo in dependencies
  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleSubmit = async (formData: VideoFormValues) => {
    const response = await fetch(`/api/content/videos/${videoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update video');
    }

    setTimeout(() => router.push(`/admin/content/videos/${videoId}`), 1500);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/content/videos/${videoId}`, { method: 'DELETE' });
      router.push('/admin/content/videos');
    } catch (error) {
      console.error('Failed to delete video:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

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
            aria-label="Back to video"
            className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
          >
            <ArrowLeft size={20} className="text-[#64748B] dark:text-[#94A3B8]" />
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

      {loadError || !initialValues ? (
        <div className="p-3 rounded-xl flex items-center gap-2 text-sm bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]">
          <AlertCircle size={16} />
          {loadError ?? 'Failed to load video data'}
        </div>
      ) : (
        <VideoForm
          initialValues={initialValues}
          statusOptions={STATUS_OPTIONS}
          submitLabel="Save Changes"
          submittingLabel="Saving..."
          successMessage="Video updated successfully!"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/admin/content/videos/${videoId}`)}
        />
      )}

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
        isLoading={isDeleting}
      />
    </div>
  );
}
