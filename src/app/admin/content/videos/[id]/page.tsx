// src/app/admin/content/videos/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Star,
  Share2,
  Heart,
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  AlertCircle,
} from 'lucide-react';
import { cn, formatDuration, formatDateTime } from '@/lib/utils';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface VideoDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  rewardAmount: number;
  bonusReward?: number;
  isSponsored: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorWebsite?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED';
  views: number;
  watchTime: number;
  likes: number;
  dislikes: number;
  shares: number;
  saves: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  tags: string[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  watches: Array<{
    id: string;
    userId: string;
    watchPercent: number;
    watchDuration: number;
    completed: boolean;
    createdAt: string;
  }>;
  engagements: Array<{
    id: string;
    userId: string;
    type: 'like' | 'dislike' | 'share' | 'save';
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    userId: string;
    content: string;
    likes: number;
    createdAt: string;
    user: {
      name: string;
      avatar: string;
    };
    replies: Array<{
      id: string;
      userId: string;
      content: string;
      likes: number;
      createdAt: string;
      user: {
        name: string;
        avatar: string;
      };
    }>;
  }>;
}

export default function VideoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;
  const { formatAmount } = useSystemCurrency();
  const { user } = useAuth();

  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const fetchVideo = useCallback(async () => {
    setIsLoading(true);
    setVideoError(null);
    try {
      const response = await fetch(`/api/content/videos/${videoId}`);
      const data = await response.json();
      setVideo(data.video);
    } catch (error) {
      console.error('Failed to fetch video:', error);
      setVideoError('Failed to load video details');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleDelete = async () => {
    if (!videoId) return;
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

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/content/videos/${videoId}/publish`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchVideo();
      }
    } catch (error) {
      console.error('Failed to publish video:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      const response = await fetch(`/api/content/videos/${videoId}/unpublish`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchVideo();
      }
    } catch (error) {
      console.error('Failed to unpublish video:', error);
    } finally {
      setIsUnpublishing(false);
    }
  };

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.error('Failed to play video:', err);
          setVideoError('Failed to play video. Please try again.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoError = () => {
    setVideoError('Failed to load video. Please check the video URL.');
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && videoRef.current?.parentElement) {
      videoRef.current.parentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80] border-[#22C55E]/20';
      case 'DRAFT':
        return 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24] border-[#F59E0B]/20';
      case 'PENDING_REVIEW':
        return 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA] border-[#2563EB]/20';
      case 'REJECTED':
        return 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171] border-[#EF4444]/20';
      default:
        return 'bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] border-[#334155]';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E]';
      case 'INTERMEDIATE':
        return 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B]';
      case 'ADVANCED':
        return 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444]';
      case 'EXPERT':
        return 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6]';
      default:
        return 'bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B]';
    }
  };

  // Check if URL is a YouTube URL
  const isYouTubeUrl = (url: string) => {
    return (
      url &&
      (url.includes('youtube.com/watch') ||
        url.includes('youtu.be/') ||
        url.includes('youtube.com/embed/'))
    );
  };

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;

    // Try to extract video ID from various YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2] && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }

    // If already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#2563EB]" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-outfit text-center">
            Loading video details...
          </p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎬</div>
        <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
          Video not found
        </p>
        <button
          onClick={() => router.push('/admin/content/videos')}
          className="mt-4 px-4 py-2 text-sm font-medium text-[#2563EB] hover:underline"
        >
          ← Back to Videos
        </button>
      </div>
    );
  }

  const youtubeEmbedUrl = video.videoUrl
    ? getYouTubeEmbedUrl(video.videoUrl)
    : null;
  const isYouTube = isYouTubeUrl(video.videoUrl || '');

  return (
    <div className="space-y-6 font-outfit pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/content/videos')}
            className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
          >
            <ArrowLeft
              size={20}
              className="text-[#64748B] dark:text-[#94A3B8]"
            />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white truncate max-w-[300px] sm:max-w-[500px]">
              {video.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full border',
                  getStatusColor(video.status),
                )}
              >
                {video.status}
              </span>
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full',
                  getDifficultyColor(video.difficulty),
                )}
              >
                {video.difficulty}
              </span>
              {video.isSponsored && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20 flex items-center gap-1">
                  <Star size={12} className="fill-current" />
                  Sponsored
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {video.status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-bold hover:bg-[#16A34A] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Publish
                </>
              )}
            </button>
          )}
          {video.status === 'ACTIVE' && (
            <button
              onClick={handleUnpublish}
              disabled={isUnpublishing}
              className="px-4 py-2 rounded-xl bg-[#F59E0B] text-[#0F172A] text-sm font-bold hover:bg-[#D97706] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isUnpublishing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Unpublishing...
                </>
              ) : (
                <>
                  <EyeOff size={16} />
                  Unpublish
                </>
              )}
            </button>
          )}
          <button
            onClick={() => router.push(`/admin/content/videos/${videoId}/edit`)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-[#DC2626] transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Video Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-[#0F172A] to-[#1E3A8A]">
              {videoError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 p-4">
                  <AlertCircle size={48} className="text-red-400" />
                  <p className="text-sm text-center text-white/80">
                    {videoError}
                  </p>
                  <button
                    onClick={() => setVideoError(null)}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : showVideoPlayer ? (
                <>
                  {/* YouTube Embed with proper configuration */}
                  {isYouTube && youtubeEmbedUrl ? (
                    <div className="w-full h-full relative">
                      <iframe
                        src={`${youtubeEmbedUrl}?enablejsapi=1&modestbranding=1&rel=0&showinfo=0&controls=1&autoplay=0&mute=0&origin=${encodeURIComponent(window.location.origin)}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.title}
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
                        referrerPolicy="strict-origin-when-cross-origin"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    // Direct video element for non-YouTube URLs
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      src={video.videoUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onError={handleVideoError}
                      onClick={togglePlay}
                      playsInline
                      webkit-playsinline="true"
                      controls={false}
                      autoPlay={false}
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      <source src={video.videoUrl} type="video/webm" />
                      <p className="text-white text-center p-4">
                        Your browser does not support the video tag.
                      </p>
                    </video>
                  )}
                  {/* Video Controls Overlay (only for non-YouTube videos) */}
                  {!isYouTube && videoRef.current && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="text-white/80 hover:text-white transition-colors touch-min-target"
                        >
                          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <div className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative group">
                          <div
                            className="h-full bg-[#2563EB] rounded-full transition-all"
                            style={{
                              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-white/80 text-xs font-mono">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <button
                          onClick={toggleMute}
                          className="text-white/80 hover:text-white transition-colors touch-min-target"
                        >
                          {isMuted ? (
                            <VolumeX size={20} />
                          ) : (
                            <Volume2 size={20} />
                          )}
                        </button>
                        <button
                          onClick={toggleFullscreen}
                          className="text-white/80 hover:text-white transition-colors touch-min-target hidden sm:block"
                        >
                          {isFullscreen ? (
                            <Minimize2 size={20} />
                          ) : (
                            <Maximize2 size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                      onError={() => {}}
                      unoptimized={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎬
                    </div>
                  )}
                  <button
                    onClick={() => setShowVideoPlayer(true)}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center group hover:bg-black/40 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Play size={28} className="text-[#2563EB] ml-1" />
                    </div>
                  </button>
                </>
              )}
              {video.isSponsored && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Star size={14} className="fill-current" />
                  Sponsored
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm font-medium px-3 py-1 rounded-full">
                {formatDuration(video.duration)}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">
              Description
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed whitespace-pre-wrap">
              {video.description || 'No description provided.'}
            </p>
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] border border-[#F1F5F9] dark:border-[#334155]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox
              icon={<Eye size={16} className="text-[#2563EB]" />}
              label="Views"
              value={video.views.toLocaleString()}
            />
            <StatBox
              icon={<Heart size={16} className="text-[#EF4444]" />}
              label="Likes"
              value={video.likes.toLocaleString()}
            />
            <StatBox
              icon={<Share2 size={16} className="text-[#8B5CF6]" />}
              label="Shares"
              value={video.shares.toLocaleString()}
            />
            <StatBox
              icon={<Bookmark size={16} className="text-[#F59E0B]" />}
              label="Saves"
              value={video.saves.toLocaleString()}
            />
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">
              Quick Info
            </h3>
            <div className="space-y-3">
              <InfoRow label="Category" value={video.category} />
              <InfoRow label="Difficulty" value={video.difficulty} />
              <InfoRow
                label="Reward"
                value={formatAmount(video.rewardAmount)}
              />
              {video.bonusReward && (
                <InfoRow
                  label="Bonus Reward"
                  value={formatAmount(video.bonusReward)}
                />
              )}
              <InfoRow
                label="Duration"
                value={formatDuration(video.duration)}
              />
              <InfoRow
                label="Completion Rate"
                value={`${Math.round(video.completionRate || 0)}%`}
              />
              {video.isSponsored && video.sponsorName && (
                <InfoRow label="Sponsor" value={video.sponsorName} />
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">
              Dates
            </h3>
            <div className="space-y-3">
              <InfoRow
                label="Created"
                value={formatDateTime(video.createdAt)}
              />
              <InfoRow
                label="Updated"
                value={formatDateTime(video.updatedAt)}
              />
              {video.publishedAt && (
                <InfoRow
                  label="Published"
                  value={formatDateTime(video.publishedAt)}
                />
              )}
            </div>
          </div>

          {/* Creator */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">
              Creator
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold">
                {(video.createdBy?.name || user?.name)?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                  {video.createdBy?.name || user?.name || 'Unknown'}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {video.createdBy?.email || user?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Video"
        description={
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Are you sure you want to delete{' '}
              <strong className="text-white">{video.title}</strong>?
            </p>
            <p className="text-xs text-red-400/70">
              This action cannot be undone. All associated data including
              watches, engagements, and comments will be permanently removed.
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

// Stat Box Component
function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-4 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-[#0F172A] dark:text-white">
        {value}
      </p>
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</p>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-[#F1F5F9] dark:border-[#334155] last:border-0">
      <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
        {label}
      </span>
      <span className="text-sm font-medium text-[#0F172A] dark:text-white">
        {value}
      </span>
    </div>
  );
}
