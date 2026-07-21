// src/app/(dashboard)/earn/videos/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Play,
  Clock,
  Award,
  Filter,
  Search,
  ChevronRight,
  CheckCircle2,
  Volume2,
  VolumeX,
  Maximize2,
  PlayCircle,
  PauseCircle,
  X,
  Eye,
  Star,
  TrendingUp,
  Sparkles,
  Briefcase,
  Coins,
  Cpu,
  BookOpen,
  Film,
  Heart,
  Flame,
  Zap,
  Trophy,
  Clock as ClockIcon,
  ThumbsUp,
  Target,
  Loader2,
} from 'lucide-react';
import { useVideos, type VideoWithProgress } from '@/hooks/useVideos';
import { useVideoWatch } from '@/hooks/useVideoWatch';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import { cn, formatDuration } from '@/lib/utils';
import { type VideoCategory as SchemaVideoCategory } from '@/lib/db/schema';
import { motion, AnimatePresence } from 'framer-motion';

// Import missing icons
import { Music, Newspaper } from 'lucide-react';

// UI category types
type UICategory =
  | 'all'
  | 'business'
  | 'finance'
  | 'tech'
  | 'education'
  | 'entertainment'
  | 'lifestyle'
  | 'gaming'
  | 'sports'
  | 'music'
  | 'news'
  | 'tutorial';

// Map UI category to schema enum
const categoryMap: Record<Exclude<UICategory, 'all'>, SchemaVideoCategory> = {
  business: 'BUSINESS',
  finance: 'FINANCE',
  tech: 'TECH',
  education: 'EDUCATION',
  entertainment: 'ENTERTAINMENT',
  lifestyle: 'LIFESTYLE',
  gaming: 'GAMING',
  sports: 'SPORTS',
  music: 'MUSIC',
  news: 'NEWS',
  tutorial: 'TUTORIAL',
};

const categories: {
  value: UICategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: 'all',
    label: 'All',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    color: 'from-blue-500 to-purple-500',
  },
  {
    value: 'business',
    label: 'Business',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'finance',
    label: 'Finance',
    icon: <Coins className="w-3.5 h-3.5" />,
    color: 'from-amber-500 to-yellow-500',
  },
  {
    value: 'tech',
    label: 'Tech',
    icon: <Cpu className="w-3.5 h-3.5" />,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    value: 'education',
    label: 'Education',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    icon: <Film className="w-3.5 h-3.5" />,
    color: 'from-pink-500 to-rose-500',
  },
  {
    value: 'lifestyle',
    label: 'Lifestyle',
    icon: <Heart className="w-3.5 h-3.5" />,
    color: 'from-red-400 to-pink-500',
  },
  {
    value: 'gaming',
    label: 'Gaming',
    icon: <Trophy className="w-3.5 h-3.5" />,
    color: 'from-violet-500 to-purple-500',
  },
  {
    value: 'sports',
    label: 'Sports',
    icon: <Flame className="w-3.5 h-3.5" />,
    color: 'from-orange-500 to-red-500',
  },
  {
    value: 'music',
    label: 'Music',
    icon: <Music className="w-3.5 h-3.5" />,
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    value: 'news',
    label: 'News',
    icon: <Newspaper className="w-3.5 h-3.5" />,
    color: 'from-slate-500 to-gray-500',
  },
  {
    value: 'tutorial',
    label: 'Tutorial',
    icon: <Target className="w-3.5 h-3.5" />,
    color: 'from-blue-500 to-indigo-500',
  },
];

// Recommendation Algorithm
function getRecommendations(
  videos: VideoWithProgress[],
  watchedIds: string[],
  limit: number = 6,
) {
  const scoredVideos = videos.map((video) => {
    let score = 0;

    score += ((video.views || 0) / 100) * 0.3;
    score += (video.likes || 0) * 0.2;
    score += (video.shares || 0) * 0.1;
    score += (video.completionRate || 0) * 0.2;
    if (video.isSponsored) score += 10;
    score += (video.rewardAmount || 0) / 10;
    if (watchedIds.includes(video.id)) score *= 0.3;

    const daysSinceCreation =
      (Date.now() - new Date(video.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceCreation) * 0.5;

    return { ...video, score };
  });

  return scoredVideos.sort((a, b) => b.score - a.score).slice(0, limit);
}

// Loading Skeleton Components
function VideoSkeleton({
  isRecommendation = false,
}: {
  isRecommendation?: boolean;
}) {
  if (isRecommendation) {
    return (
      <div className="animate-pulse bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] overflow-hidden">
        <div className="aspect-video bg-[#F1F5F9] dark:bg-[#334155]" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-[#F1F5F9] dark:bg-[#334155] rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded w-12" />
            <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded w-12" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-3 flex gap-3">
      <div className="w-20 sm:w-24 md:w-28 h-14 sm:h-16 md:h-20 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-[#F1F5F9] dark:bg-[#334155] rounded w-3/4" />
        <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded w-12" />
          <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded w-12" />
        </div>
      </div>
    </div>
  );
}

function VideoListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <VideoSkeleton key={i} />
      ))}
    </div>
  );
}

export default function VideosPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<UICategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoWithProgress | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [watchHistory, setWatchHistory] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<VideoWithProgress[]>([]);
  const [allVideos, setAllVideos] = useState<VideoWithProgress[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  // Tracks whether we've already applied the resume-position seek for the
  // currently open video, so we don't re-seek on every metadata event.
  const hasResumedRef = useRef(false);

  // Use system currency hook
  const { formatAmount } = useSystemCurrency();

  // Detect touch device for better PWA UX
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Convert UI category to schema category
  const schemaCategory =
    selectedCategory === 'all' ? undefined : categoryMap[selectedCategory];

  // Use the hook with pagination
  const { data, isLoading } = useVideos({
    category: schemaCategory,
    search: searchQuery,
    page,
    limit: 20,
  });

  const { trackWatch } = useVideoWatch();

  const videos = data?.videos || [];
  const stats = data?.stats || { totalEarned: 0, watched: 0, available: 0 };
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Update all videos when data changes
  useEffect(() => {
    if (page === 1) {
      setAllVideos(videos);
    } else {
      setAllVideos((prev) => [...prev, ...videos]);
    }
    setHasMore(page < totalPages);
    setIsLoadingMore(false);
  }, [videos, page, totalPages]);

  // Update recommendations when all videos change
  useEffect(() => {
    if (allVideos.length > 0) {
      const recommended = getRecommendations(allVideos, watchHistory, 6);
      setRecommendedVideos(recommended);
    }
  }, [allVideos, watchHistory]);

  const handleWatchVideo = (video: VideoWithProgress) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
    setProgress(video.watchProgress || 0);
    setIsPlaying(false);
    hasResumedRef.current = false;
    // Fire-and-forget "opened" ping. Server-side this is now safe to call
    // repeatedly — it no longer self-locks subsequent progress calls (see
    // videos.service.ts watchVideo()).
    trackWatch(video.id, 0, 0);

    setWatchHistory((prev) =>
      prev.includes(video.id) ? prev : [...prev, video.id],
    );
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
    setIsPlaying(false);
    hasResumedRef.current = false;
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && selectedVideo) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration || selectedVideo.duration || 1;
      const newProgress = (currentTime / duration) * 100;
      setProgress(Math.min(newProgress, 100));

      if (Math.floor(newProgress / 5) > Math.floor((newProgress - 0.5) / 5)) {
        trackWatch(
          selectedVideo.id,
          Math.min(newProgress, 100),
          Math.floor(currentTime),
        );
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setProgress(100);
    if (selectedVideo) {
      const duration =
        videoRef.current?.duration || selectedVideo.duration || 0;
      trackWatch(selectedVideo.id, 100, Math.floor(duration));
    }
  };

  // NEW: applies the saved watch position once video metadata (duration) is
  // available. Previously `watchProgress` only drove the visual progress
  // bar on open — the actual <video> element always started at 0:00.
  const handleLoadedMetadata = () => {
    if (
      videoRef.current &&
      selectedVideo?.watchProgress &&
      !hasResumedRef.current &&
      videoRef.current.duration
    ) {
      const resumeTime =
        (selectedVideo.watchProgress / 100) * videoRef.current.duration;
      // Don't resume into the last couple seconds — treat that as "done,
      // start over" rather than replaying a sliver of the video.
      if (selectedVideo.watchProgress < 98) {
        videoRef.current.currentTime = resumeTime;
      }
      hasResumedRef.current = true;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && playerRef.current) {
      playerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // NEW: seek-by-click/drag on the progress bar. Previously this div was
  // styled as a scrubber (cursor-pointer, hover handle) but had no handler
  // at all, so clicking or dragging it did nothing.
  const seekToClientX = useCallback((clientX: number) => {
    const el = seekBarRef.current;
    const video = videoRef.current;
    if (!el || !video || !video.duration) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    video.currentTime = pct * video.duration;
    setProgress(pct * 100);
  }, []);

  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    seekToClientX(e.clientX);
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag-seek while the primary button/touch is active.
    if (e.buttons !== 1 && e.pointerType === 'mouse') return;
    seekToClientX(e.clientX);
  };

  // Handle category change - reset page
  const handleCategoryChange = (category: UICategory) => {
    setSelectedCategory(category);
    setPage(1);
    setAllVideos([]);
  };

  // Handle search - reset page
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
    setAllVideos([]);
  };

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoadingMore, isLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlayerOpen) {
        handleClosePlayer();
      }
      if (e.key === ' ' && isPlayerOpen) {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerOpen, isPlaying]);


  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: isTouchDevice ? '200px' : '100px',
      },
    );

    const loadMoreElement = document.getElementById('load-more-trigger');
    if (loadMoreElement) {
      observer.observe(loadMoreElement);
    }

    return () => {
      if (loadMoreElement) {
        observer.unobserve(loadMoreElement);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, handleLoadMore, isTouchDevice]);

  return (
    <div className="space-y-4 sm:space-y-5 pb-16 sm:pb-20 lg:pb-0 font-outfit max-w-7xl mx-auto px-3 sm:px-4 md:px-6 touch-manipulation">
      {/* Header with Stats - PWA Optimized */}
      <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#F1F5F9] dark:border-[#334155] flex items-center justify-center hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-all touch-min-target flex-shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#64748B] dark:text-[#94A3B8]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-[#0F172A] dark:text-white truncate">
              Videos
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-[#64748B] dark:text-[#94A3B8] truncate">
              Watch and earn rewards
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 flex-nowrap xs:flex-wrap">
          <div className="flex items-center gap-1 bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#22C55E] dark:text-[#4ADE80]" />
            <span className="text-[10px] sm:text-xs font-bold text-[#22C55E] dark:text-[#4ADE80] whitespace-nowrap">
              +{formatAmount(stats.totalEarned)} today
            </span>
          </div>
          <div className="flex items-center gap-1 bg-[#EFF6FF] dark:bg-[#2563EB]/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
            <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
            <span className="text-[10px] sm:text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] whitespace-nowrap">
              {stats.watched} watched
            </span>
          </div>
          <div className="flex items-center gap-1 bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8B5CF6] dark:text-[#A78BFA]" />
            <span className="text-[10px] sm:text-xs font-bold text-[#8B5CF6] dark:text-[#A78BFA] whitespace-nowrap">
              {stats.available} available
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
        <div className="flex-1 min-w-[140px] xs:min-w-[180px] sm:min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#64748B]" />
          <input
            type="search"
            inputMode="search"
            placeholder="Search videos..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-xs sm:text-sm bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] touch-min-target"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <button className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors text-[10px] sm:text-xs md:text-sm font-medium text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5 sm:gap-2 flex-shrink-0 touch-min-target">
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Filter</span>
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={cn(
              'px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 sm:gap-1.5 touch-min-target flex-shrink-0',
              selectedCategory === cat.value
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : 'bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] dark:hover:border-[#60A5FA]',
            )}
            onClick={() => handleCategoryChange(cat.value)}
          >
            <span className="hidden xs:inline">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recommended Section */}
      {!isLoading && recommendedVideos.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] p-1 rounded-lg">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
              🔥 Recommended for You
            </h2>
            <span className="text-[8px] sm:text-[10px] text-[#94A3B8] dark:text-[#64748B] hidden sm:inline">
              • Based on your activity
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {recommendedVideos.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden cursor-pointer group touch-min-target"
                onClick={() => handleWatchVideo(video)}
              >
                <div className="relative aspect-video bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] overflow-hidden">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl">
                      🎬
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB] ml-0.5" />
                    </div>
                  </div>
                  {video.isSponsored && (
                    <div className="absolute top-1 left-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
                      <Star className="w-[7px] h-[7px] sm:w-2 sm:h-2 fill-current" />
                      Sponsored
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] sm:text-[9px] font-medium px-1 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                <div className="p-2 sm:p-3">
                  <h3 className="text-[10px] sm:text-xs font-semibold text-[#0F172A] dark:text-white truncate">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                    <span className="text-[8px] sm:text-[9px] text-[#22C55E] font-bold bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-1 py-0.5 rounded-full flex items-center gap-0.5">
                      <Award className="w-2 h-2 sm:w-2.5 sm:h-2.5" />+
                      {formatAmount(video.rewardAmount)}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                      <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                      {video.views || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Videos Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
            {selectedCategory === 'all'
              ? 'All Videos'
              : categories.find((c) => c.value === selectedCategory)?.label}
          </h2>
          <span className="text-[8px] sm:text-[10px] text-[#94A3B8] dark:text-[#64748B]">
            {total} videos
          </span>
        </div>

        {/* Loading State with Skeletons */}
        {isLoading && page === 1 ? (
          <VideoListSkeleton />
        ) : allVideos.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155]">
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">🎬</div>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] font-medium">
              No videos found
            </p>
            <p className="text-[10px] sm:text-xs text-[#94A3B8] dark:text-[#64748B] mt-0.5 sm:mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {allVideos.map((video: VideoWithProgress) => {
              const progress = video.watchProgress || 0;
              const isCompleted = progress >= 80;
              const isWatched = progress > 0;
              const isSponsored = video.isSponsored || false;
              const isRecommended = recommendedVideos.some(
                (v) => v.id === video.id,
              );

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white dark:bg-[#1E293B] rounded-xl border ${
                    isRecommended
                      ? 'border-[#F59E0B]/30 dark:border-[#F59E0B]/20'
                      : 'border-[#F1F5F9] dark:border-[#334155]'
                  } shadow-sm p-2.5 sm:p-3 md:p-4 flex gap-2.5 sm:gap-3 md:gap-4 cursor-pointer hover:shadow-md hover:border-[#2563EB] dark:hover:border-[#60A5FA] transition-all group relative touch-min-target`}
                  onClick={() => handleWatchVideo(video)}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
                      <Sparkles className="w-[7px] h-[7px] sm:w-2 sm:h-2" />
                      Recommended
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-20 sm:w-24 md:w-28 h-14 sm:h-16 md:h-20 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex-shrink-0 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        width={112}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl">
                        🎬
                      </div>
                    )}

                    {/* Sponsored Badge */}
                    {isSponsored && (
                      <div className="absolute top-0.5 left-0.5 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[6px] sm:text-[7px] md:text-[8px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
                        <Star className="w-[6px] h-[6px] sm:w-2 sm:h-2 fill-current" />
                        Sponsored
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[17px] md:h-[17px] text-[#2563EB] ml-0.5" />
                      </div>
                    </div>

                    {isCompleted && (
                      <div className="absolute top-0.5 right-0.5 bg-[#22C55E] text-white text-[6px] sm:text-[7px] md:text-[8px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        Done
                      </div>
                    )}

                    {/* Duration Badge */}
                    <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[7px] sm:text-[8px] md:text-[9px] font-medium px-1 sm:px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start gap-1 sm:gap-2">
                      <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-[#0F172A] dark:text-white truncate flex-1">
                        {video.title}
                      </h3>
                      {isSponsored && (
                        <span className="flex-shrink-0 text-[7px] sm:text-[8px] md:text-[9px] font-bold text-[#F59E0B] bg-[#FFFBEB] dark:bg-[#F59E0B]/20 px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          Sponsored
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 mt-0.5 sm:mt-1">
                      <span className="text-[8px] sm:text-[9px] md:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                        <Clock className="w-[9px] h-[9px] sm:w-2.5 sm:h-2.5" />
                        {formatDuration(video.duration)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] md:text-xs font-bold text-[#22C55E] dark:text-[#4ADE80] bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Award className="w-[9px] h-[9px] sm:w-2.5 sm:h-2.5" />+
                        {formatAmount(video.rewardAmount)}
                      </span>
                      <span className="hidden xs:inline-block text-[8px] sm:text-[9px] md:text-xs text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#334155] px-1 sm:px-1.5 py-0.5 rounded-full">
                        {video.category}
                      </span>
                      <span className="text-[8px] sm:text-[9px] md:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                        <Eye className="w-[9px] h-[9px] sm:w-2.5 sm:h-2.5" />
                        {video.views || 0}
                      </span>
                      {video.likes > 0 && (
                        <span className="text-[8px] sm:text-[9px] md:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                          <ThumbsUp className="w-[9px] h-[9px] sm:w-2.5 sm:h-2.5" />
                          {video.likes}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isWatched && (
                      <div className="mt-1 sm:mt-1.5 md:mt-2">
                        <div className="h-1 sm:h-1.5 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              isCompleted ? 'bg-[#22C55E]' : 'bg-[#2563EB]',
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-[7px] sm:text-[8px] md:text-[9px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          {isCompleted
                            ? '✅ Completed'
                            : `${Math.round(progress)}% watched`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center flex-shrink-0 pl-1 sm:pl-2">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold text-[#2563EB] dark:text-[#60A5FA]">
                      {formatAmount(video.rewardAmount)}
                    </span>
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#94A3B8] dark:text-[#64748B] ml-0.5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div
            id="load-more-trigger"
            className="py-3 sm:py-4 flex justify-center"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="text-[10px] sm:text-sm">Loading more...</span>
              </div>
            ) : (
              <button
                onClick={handleLoadMore}
                className="w-full py-2 sm:py-2.5 md:py-3 rounded-xl border border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors text-[10px] sm:text-xs md:text-sm font-medium text-[#64748B] dark:text-[#94A3B8] touch-min-target"
              >
                Load More Videos
              </button>
            )}
          </div>
        )}

        {/* End of list message */}
        {!hasMore && allVideos.length > 0 && (
          <div className="text-center py-3 sm:py-4">
            <p className="text-[10px] sm:text-xs text-[#94A3B8] dark:text-[#64748B]">
              You&apos;ve reached the end of the list!
            </p>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {isPlayerOpen && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col safe-top safe-bottom"
          >
            {/* Player Header */}
            <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/50 backdrop-blur-sm safe-top">
              <button
                onClick={handleClosePlayer}
                className="text-white/70 hover:text-white transition-colors touch-min-target"
              >
                <X className="w-5 h-5 sm:w-[22px] sm:h-[22px] md:w-6 md:h-6" />
              </button>
              <span className="text-white font-medium text-[10px] sm:text-xs md:text-sm truncate max-w-[35%] sm:max-w-[40%] md:max-w-[60%]">
                {selectedVideo.title}
              </span>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {selectedVideo.isSponsored && (
                  <span className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[7px] sm:text-[8px] md:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current" />
                    Sponsored
                  </span>
                )}
                <span className="text-[#22C55E] text-[8px] sm:text-[10px] md:text-xs font-bold bg-emerald-500/20 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full">
                  +{formatAmount(selectedVideo.rewardAmount)}
                </span>
              </div>
            </div>

            {/* Video Player */}
            <div
              ref={playerRef}
              className="flex-1 flex items-center justify-center p-1 sm:p-2 md:p-4 relative bg-gradient-to-b from-[#0F172A] to-[#1E3A8A]"
            >
              <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg sm:rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnd}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={handleLoadedMetadata}
                  playsInline
                  webkit-playsinline="true"
                >
                  <source src={selectedVideo.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {!selectedVideo.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-3">
                        🎬
                      </div>
                      <p className="text-white/60 text-[10px] sm:text-xs md:text-sm">
                        {selectedVideo.title}
                      </p>
                    </div>
                  </div>
                )}

                {!isPlaying && progress === 0 && (
                  <button
                    className="absolute inset-0 flex items-center justify-center touch-min-target"
                    onClick={togglePlay}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center hover:scale-110 transition-transform">
                      <PlayCircle className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                    </div>
                  </button>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <button
                      onClick={togglePlay}
                      className="text-white/80 hover:text-white transition-colors touch-min-target"
                    >
                      {isPlaying ? (
                        <PauseCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px] md:w-7 md:h-7" />
                      ) : (
                        <PlayCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px] md:w-7 md:h-7" />
                      )}
                    </button>

                    {/*
                      FIX: this bar previously had no interaction handler at
                      all — it was purely decorative (fill width + hover
                      handle) despite the cursor-pointer styling. Now
                      supports click-to-seek and drag-to-scrub via Pointer
                      Events, which unify mouse + touch handling.
                    */}
                    <div
                      ref={seekBarRef}
                      onPointerDown={handleSeekPointerDown}
                      onPointerMove={handleSeekPointerMove}
                      className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative group touch-min-target"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ left: `calc(${progress}% - 6px)` }}
                      />
                    </div>

                    <span className="text-white/80 text-[8px] sm:text-[10px] md:text-xs font-mono whitespace-nowrap">
                      {formatTime(
                        (progress / 100) * (selectedVideo.duration || 272),
                      )}{' '}
                      / {formatDuration(selectedVideo.duration || 272)}
                    </span>

                    <button
                      onClick={toggleMute}
                      className="text-white/80 hover:text-white transition-colors touch-min-target hidden xs:flex"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                      ) : (
                        <Volume2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                      )}
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="text-white/80 hover:text-white transition-colors touch-min-target hidden sm:flex"
                    >
                      <Maximize2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mt-1.5 sm:mt-2 md:mt-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] md:text-xs text-white/60 mb-0.5">
                        <span className="hidden xs:inline">
                          Watch to earn{' '}
                          {formatAmount(selectedVideo.rewardAmount)}
                        </span>
                        <span className="xs:hidden">
                          Earn {formatAmount(selectedVideo.rewardAmount)}
                        </span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            progress >= 80
                              ? 'bg-[#22C55E]'
                              : 'bg-gradient-to-r from-[#2563EB] to-[#22C55E]',
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    {progress >= 80 && (
                      <span className="text-[#22C55E] text-[8px] sm:text-[9px] md:text-xs font-bold flex items-center gap-0.5 flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px]" />
                        <span className="hidden xs:inline">Earned!</span>
                      </span>
                    )}
                  </div>
                </div>

                {selectedVideo.isSponsored && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 backdrop-blur-sm text-white text-[7px] sm:text-[8px] md:text-[9px] font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
                    <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#FBBF24] text-[#FBBF24]" />
                    Sponsored
                  </div>
                )}
              </div>
            </div>

            {/* Player Bottom Info */}
            <div className="p-2 sm:p-3 md:p-4 bg-black/50 backdrop-blur-sm border-t border-white/10 safe-bottom">
              <div className="max-w-4xl mx-auto w-full">
                <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm">
                  {selectedVideo.title}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mt-0.5 sm:mt-1">
                  <span className="text-[8px] sm:text-[10px] md:text-xs text-white/60">
                    {selectedVideo.category}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-[8px] sm:text-[10px] md:text-xs text-white/60 flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {selectedVideo.views || 0} views
                  </span>
                  {selectedVideo.isSponsored && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] text-[#FBBF24] flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Sponsored
                      </span>
                    </>
                  )}
                  <span className="text-white/20">•</span>
                  <span className="text-[8px] sm:text-[10px] md:text-xs text-[#22C55E] flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {formatAmount(selectedVideo.rewardAmount)} reward
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
