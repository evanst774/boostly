// src/app/(dashboard)/earn/games/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Award,
  Clock,
  Crown,
  Eye,
  Flame,
  Gem,
  Gift,
  Loader2,
  Maximize2,
  Medal,
  Minimize2,
  Play,
  Rocket,
  Search,
  Shield,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useGames } from '@/hooks/useGames';
import { useGameSession, type CompletionResult } from '@/hooks/useGameSession';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import { cn } from '@/lib/utils';
import {
  type Game,
  type GameCategory as SchemaGameCategory,
} from '@/lib/db/schema';

// ============================================
// CATEGORIES
// ============================================

type UICategory =
  | 'all'
  | 'puzzle'
  | 'action'
  | 'casual'
  | 'strategy'
  | 'quiz'
  | 'racing'
  | 'sports'
  | 'adventure';

const categoryMap: Record<Exclude<UICategory, 'all'>, SchemaGameCategory> = {
  puzzle: 'PUZZLE',
  action: 'ACTION',
  casual: 'CASUAL',
  strategy: 'STRATEGY',
  quiz: 'QUIZ',
  racing: 'RACING',
  sports: 'SPORTS',
  adventure: 'ADVENTURE',
};

const categories: ReadonlyArray<{
  value: UICategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: 'all',
    label: 'All Games',
    icon: <Zap size={14} />,
    color: 'from-blue-500 to-purple-500',
  },
  {
    value: 'puzzle',
    label: 'Puzzle',
    icon: <Target size={14} />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    value: 'action',
    label: 'Action',
    icon: <Flame size={14} />,
    color: 'from-red-500 to-orange-500',
  },
  {
    value: 'casual',
    label: 'Casual',
    icon: <Gem size={14} />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'strategy',
    label: 'Strategy',
    icon: <Crown size={14} />,
    color: 'from-amber-500 to-yellow-500',
  },
  {
    value: 'quiz',
    label: 'Quiz',
    icon: <Medal size={14} />,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    value: 'racing',
    label: 'Racing',
    icon: <Rocket size={14} />,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    value: 'sports',
    label: 'Sports',
    icon: <Trophy size={14} />,
    color: 'from-green-500 to-emerald-500',
  },
  {
    value: 'adventure',
    label: 'Adventure',
    icon: <Shield size={14} />,
    color: 'from-violet-500 to-purple-500',
  },
];

const CATEGORY_EMOJI: Record<SchemaGameCategory, string> = {
  PUZZLE: '🧩',
  ACTION: '⚡',
  CASUAL: '😊',
  STRATEGY: '♟️',
  QUIZ: '🧠',
  RACING: '🏎️',
  SPORTS: '🏆',
  ADVENTURE: '🗺️',
};

const CATEGORY_GRADIENT: Record<SchemaGameCategory, string> = {
  PUZZLE: 'from-[#8B5CF6] to-[#6D28D9]',
  ACTION: 'from-[#EF4444] to-[#DC2626]',
  CASUAL: 'from-[#22C55E] to-[#16A34A]',
  STRATEGY: 'from-[#F59E0B] to-[#D97706]',
  QUIZ: 'from-[#3B82F6] to-[#1D4ED8]',
  RACING: 'from-[#EC4899] to-[#BE185D]',
  SPORTS: 'from-[#22C55E] to-[#16A34A]',
  ADVENTURE: 'from-[#8B5CF6] to-[#6D28D9]',
};

// ============================================
// SKELETON
// ============================================

function GameCardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] overflow-hidden">
      <div className="aspect-[16/10] bg-[#F1F5F9] dark:bg-[#334155]" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-[#F1F5F9] dark:bg-[#334155] rounded w-3/4" />
        <div className="h-3 bg-[#F1F5F9] dark:bg-[#334155] rounded w-1/2" />
      </div>
    </div>
  );
}

// ============================================
// GAME FRAME — the real player
// ============================================

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hosts the actual game in an iframe and reports nothing that affects payout.
 *
 * The reward figures shown here are echoed straight back from the server's
 * heartbeat response — this component never computes an amount, so what the
 * user sees and what they are paid cannot drift apart.
 */
function GameFrame({ game, onClose }: { game: Game; onClose: () => void }) {
  const { formatAmount } = useSystemCurrency();
  const {
    session,
    progress,
    isStarting,
    isCompleting,
    error,
    start,
    complete,
    reset,
  } = useGameSession();

  const [result, setResult] = useState<CompletionResult | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveScore, setLiveScore] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Open the session once on mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start(game.id);
    return reset;
  }, [game.id, start, reset]);

  /**
   * Optional score channel. Games that know nothing about Boostly simply never
   * post a message, and everything still works — which is why unmodified
   * third-party games can be dropped in without a wrapper.
   *
   * The origin check is mandatory: without it, any page that gets a handle on
   * this window can inject messages.
   */
  useEffect(() => {
    if (!session) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== session.embedOrigin) return;

      const data: unknown = event.data;
      if (typeof data !== 'object' || data === null) return;

      const payload = data as {
        source?: unknown;
        type?: unknown;
        score?: unknown;
      };
      if (payload.source !== 'boostly-game') return;
      if (payload.type !== 'score') return;
      if (typeof payload.score !== 'number' || !Number.isFinite(payload.score))
        return;

      setLiveScore(Math.max(0, Math.floor(payload.score)));
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [session]);

  const handleFinish = useCallback(async () => {
    const outcome = await complete({ score: liveScore });
    if (outcome) setResult(outcome);
    else onClose();
  }, [complete, liveScore, onClose]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const verified = progress?.verifiedSeconds ?? 0;
  const minSeconds = session?.minPlaySeconds ?? game.minPlayDuration;
  const qualifyProgress = Math.min(
    (verified / Math.max(minSeconds, 1)) * 100,
    100,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col safe-top safe-bottom"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-black/40 backdrop-blur-md border-b border-white/5">
        <button
          onClick={result ? onClose : handleFinish}
          className="text-white/70 hover:text-white transition-colors touch-min-target"
          aria-label="Exit game"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-[8px] sm:text-[10px] text-white/50 uppercase tracking-wider">
              Played
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-white tabular-nums">
              {formatClock(verified)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[8px] sm:text-[10px] text-white/50 uppercase tracking-wider">
              Earning
            </p>
            <p
              className={cn(
                'text-lg sm:text-xl font-extrabold tabular-nums',
                progress?.qualified ? 'text-[#22C55E]' : 'text-white/50',
              )}
            >
              {formatAmount(progress?.projectedReward ?? 0)}
            </p>
          </div>
          {game.isSponsored && (
            <span className="hidden sm:flex bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[9px] font-bold px-2 py-0.5 rounded-full items-center gap-0.5">
              <Star size={10} className="fill-current" />
              Sponsored
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="text-white/50 hover:text-white transition-colors touch-min-target hidden sm:flex"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={result ? onClose : handleFinish}
            disabled={isCompleting}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors touch-min-target"
          >
            {isCompleting ? 'Saving…' : 'Finish'}
          </button>
        </div>
      </div>

      {/* Qualifying progress */}
      {!result && (
        <div className="px-3 sm:px-4 py-2 bg-black/20 border-b border-white/5">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/60 mb-1">
            <span>
              {progress?.qualified
                ? 'Reward unlocked — keep playing to earn more'
                : `Play ${formatClock(Math.max(minSeconds - verified, 0))} more to unlock your reward`}
            </span>
            <span className="tabular-nums">{Math.round(qualifyProgress)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${qualifyProgress}%` }}
              transition={{ duration: 0.4 }}
              className={cn(
                'h-full rounded-full',
                progress?.qualified
                  ? 'bg-[#22C55E]'
                  : 'bg-gradient-to-r from-[#2563EB] to-[#22C55E]',
              )}
            />
          </div>
        </div>
      )}

      {/* Play area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden"
      >
        {isStarting && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading {game.name}…</p>
          </div>
        )}

        {error && !isStarting && (
          <div className="text-center px-6 max-w-sm">
            <div className="text-5xl mb-3">🎮</div>
            <p className="text-white font-semibold mb-1">
              Can&apos;t start this game
            </p>
            <p className="text-white/60 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-5 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              Back to games
            </button>
          </div>
        )}

        {session && !error && !result && (
          <iframe
            src={session.embedUrl}
            title={game.name}
            className="w-full h-full rounded-xl border border-white/5 bg-black"
            /* No allow-same-origin: the frame gets no access to our cookies or DOM. */
            sandbox="allow-scripts allow-pointer-lock allow-popups-to-escape-sandbox"
            allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Result overlay */}
        {result && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 text-center"
          >
            {result.status === 'REWARDED' ? (
              <>
                <div className="text-6xl sm:text-7xl">🎉</div>
                <h2 className="text-2xl font-extrabold text-white">
                  Nice run!
                </h2>
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-8 py-4 w-full max-w-xs">
                  <p className="text-white/60 text-xs">Added to your wallet</p>
                  <p className="text-3xl font-extrabold text-[#22C55E]">
                    {formatAmount(result.rewardEarned)}
                  </p>
                  <p className="text-white/40 text-[10px] mt-1">
                    New balance {formatAmount(result.newBalance)}
                  </p>
                </div>
                <p className="text-white/50 text-xs">
                  {formatClock(result.verifiedSeconds)} of verified play
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl sm:text-7xl">
                  {result.reason === 'TOO_SHORT' ? '⏱️' : '🚫'}
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {result.reason === 'TOO_SHORT' && 'A bit too short'}
                  {result.reason === 'CAP_REACHED' && 'Daily limit reached'}
                  {result.reason === 'FLAGGED' && 'Session not counted'}
                  {result.reason === 'ALREADY_CLAIMED' && 'Already claimed'}
                </h2>
                <p className="text-white/60 text-sm max-w-xs">
                  {result.reason === 'TOO_SHORT' &&
                    `Play at least ${formatClock(result.minPlaySeconds)} to earn a reward. You played ${formatClock(result.verifiedSeconds)}.`}
                  {result.reason === 'CAP_REACHED' &&
                    "You've earned everything available from this game today. Come back tomorrow."}
                  {result.reason === 'FLAGGED' &&
                    "We couldn't verify this play session. Try playing again normally."}
                  {result.reason === 'ALREADY_CLAIMED' &&
                    'This session was already added to your wallet.'}
                </p>
              </>
            )}

            <div className="flex gap-3 flex-wrap justify-center pt-2">
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/30 text-white font-bold px-6 py-2.5 rounded-full transition-all text-sm flex items-center gap-2"
              >
                <Gift size={16} />
                Done
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// PAGE
// ============================================

export default function GamesPage() {
  const router = useRouter();
  const { formatAmount } = useSystemCurrency();

  const [selectedCategory, setSelectedCategory] = useState<UICategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [page, setPage] = useState(1);
  const [allGames, setAllGames] = useState<Game[]>([]);

  const schemaCategory =
    selectedCategory === 'all' ? undefined : categoryMap[selectedCategory];

  const { data, isLoading, refetch } = useGames({
    category: schemaCategory,
    search: searchQuery,
    page,
    limit: 20,
  });

  const games = data?.games ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages;

  useEffect(() => {
    setAllGames((prev) => (page === 1 ? games : [...prev, ...games]));
  }, [games, page]);

  const handleCategoryChange = (category: UICategory) => {
    setSelectedCategory(category);
    setPage(1);
    setAllGames([]);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
    setAllGames([]);
  };

  const handleCloseGame = () => {
    setSelectedGame(null);
    void refetch();
  };

  const featured = allGames[0];

  return (
    <div className="space-y-5 pb-20 lg:pb-0 font-outfit max-w-7xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-xl border border-[#F1F5F9] dark:border-[#334155] flex items-center justify-center hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-all touch-min-target"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft
              size={17}
              className="text-[#64748B] dark:text-[#94A3B8]"
            />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
              Games
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] truncate">
              Play and earn rewards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 px-3 py-1.5 rounded-full flex-shrink-0">
            <Trophy size={14} className="text-[#8B5CF6] dark:text-[#A78BFA]" />
            <span className="text-xs font-bold text-[#8B5CF6] dark:text-[#A78BFA] whitespace-nowrap">
              {total} games
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#64748B]"
        />
        <input
          type="search"
          placeholder="Search games..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={cn(
              'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 touch-min-target',
              selectedCategory === cat.value
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : 'bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] dark:hover:border-[#60A5FA]',
            )}
            onClick={() => handleCategoryChange(cat.value)}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured */}
      {!isLoading && featured && (
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] p-5 sm:p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setSelectedGame(featured)}
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl sm:text-8xl opacity-20 select-none">
            {CATEGORY_EMOJI[featured.category]}
          </div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 bg-[#F59E0B]/20 text-[#FBBF24] text-[10px] font-bold px-3 py-1 rounded-full mb-3">
              <Zap size={14} />
              FEATURED
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              {featured.name}
            </h2>
            <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-md line-clamp-2">
              {featured.description ?? 'Play to earn rewards'}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
              <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-5 sm:px-6 py-2 rounded-full transition-colors text-xs sm:text-sm">
                Play Now
              </button>
              <span className="text-xs sm:text-sm text-white/70 flex items-center gap-1">
                <Trophy size={16} className="text-[#F59E0B]" />
                Up to {formatAmount(featured.maxReward)}
              </span>
              <span className="text-xs sm:text-sm text-white/70 flex items-center gap-1">
                <Clock size={16} className="text-[#60A5FA]" />
                {featured.minPlayDuration}s to earn
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading && page === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : allGames.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155]">
          <div className="text-5xl mb-3">🎮</div>
          <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
            No games available
          </p>
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">
            Check back later for new games
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {allGames.map((game) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              onClick={() => setSelectedGame(game)}
            >
              <div
                className={cn(
                  'aspect-[16/10] flex items-center justify-center text-4xl sm:text-5xl relative overflow-hidden',
                  `bg-gradient-to-br ${CATEGORY_GRADIENT[game.category]}`,
                )}
              >
                {game.thumbnailUrl ? (
                  <Image
                    src={game.thumbnailUrl}
                    alt={game.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <span className="relative z-10 drop-shadow-lg">
                    {CATEGORY_EMOJI[game.category]}
                  </span>
                )}
                {game.isSponsored && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
                    <Star size={8} className="fill-current" />
                    Sponsored
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={24} className="text-white" />
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white truncate">
                  {game.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#22C55E] dark:text-[#4ADE80] bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Award size={10} />
                    {formatAmount(game.baseReward)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                    <Eye size={10} />
                    {game.totalPlays}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && allGames.length > 0 && (
        <div className="py-3 flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 rounded-xl border border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors text-xs sm:text-sm font-medium text-[#64748B] dark:text-[#94A3B8] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading more…
              </span>
            ) : (
              'Load More Games'
            )}
          </button>
        </div>
      )}

      {/* Player */}
      <AnimatePresence>
        {selectedGame && (
          <GameFrame game={selectedGame} onClose={handleCloseGame} />
        )}
      </AnimatePresence>
    </div>
  );
}
