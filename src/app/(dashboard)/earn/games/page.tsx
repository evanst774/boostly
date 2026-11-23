// src/app/(dashboard)/earn/games/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import {
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
  Ban,
  Gamepad2,
  PartyPopper,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { GameCategoryIcon } from '@/components/earn/GameCategoryIcon';
import { GameLoader } from '@/components/earn/GameLoader';
import { useGames } from '@/hooks/useGames';
import { useGameSession, type CompletionResult } from '@/hooks/useGameSession';
import { useEarnToday } from '@/hooks/useEarnToday';
import { canGrantGameStorage, gameSandbox } from '@/lib/games/embed-policy';
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
  // The loader stays up until the game inside the frame has finished loading.
  const [frameLoaded, setFrameLoaded] = useState(false);
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
    // No session yet (still loading / failed to start): just leave.
    if (!session) {
      onClose();
      return;
    }
    const outcome = await complete({ score: liveScore });
    // On failure the hook sets `error`, which is shown in place of the game.
    if (outcome) setResult(outcome);
  }, [complete, liveScore, onClose, session]);

  // iPhone Safari can't make a page element full screen; hide the button there.
  const [canFullscreen, setCanFullscreen] = useState(false);
  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void (containerRef.current.parentElement ?? containerRef.current).requestFullscreen();
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
      className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col safe-top safe-bottom font-outfit antialiased"
    >
      {/* Slim bar: exit · play time and reward · finish. Kept to one row so
          the game gets nearly the whole screen. */}
      <div className="relative flex h-12 shrink-0 items-center gap-2 border-b border-white/5 bg-black/50 px-2 sm:h-14 sm:px-4">
        <button
          onClick={result ? onClose : handleFinish}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Exit game"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-white sm:text-sm">{game.name}</p>
          <p className="truncate text-[11px] text-white/55 tabular-nums">
            {result
              ? 'Session saved'
              : progress?.qualified
                ? `Reward unlocked · ${formatAmount(progress.projectedReward)} · keep playing to earn more`
                : `${formatClock(verified)} played · ${formatClock(Math.max(minSeconds - verified, 0))} to unlock your reward`}
          </p>
        </div>

        {game.isSponsored && (
          <span className="hidden items-center gap-0.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] px-2 py-0.5 text-[9px] font-bold text-[#0F172A] md:flex">
            <Star size={10} className="fill-current" />
            Sponsored
          </span>
        )}

        <span
          className={cn(
            'hidden rounded-lg px-2 py-1 text-xs font-extrabold tabular-nums sm:block',
            progress?.qualified ? 'bg-[#22C55E]/15 text-[#22C55E]' : 'bg-white/5 text-white/50',
          )}
        >
          {formatAmount(progress?.projectedReward ?? 0)}
        </span>

        {canFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}
        <button
          onClick={result ? onClose : handleFinish}
          disabled={isCompleting}
          className={cn(
            'h-9 rounded-xl px-3 text-xs font-bold transition-colors disabled:opacity-50 sm:px-4 sm:text-sm',
            progress?.qualified
              ? 'bg-[#22C55E] text-[#052E16] hover:bg-[#16A34A]'
              : 'bg-white/10 text-white hover:bg-white/20',
          )}
        >
          {isCompleting ? 'Saving…' : progress?.qualified ? 'Claim' : 'Finish'}
        </button>

        {/* Progress towards the reward, as a thin line under the bar */}
        {!result && (
          <div className="absolute inset-x-0 -bottom-px h-[3px] bg-white/5">
            <motion.div
              animate={{ width: `${qualifyProgress}%` }}
              transition={{ duration: 0.4 }}
              className={cn('h-full', progress?.qualified ? 'bg-[#22C55E]' : 'bg-gradient-to-r from-[#2563EB] to-[#22C55E]')}
            />
          </div>
        )}
      </div>

      {/* Play area */}
      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black sm:p-3"
      >
        <AnimatePresence>
          {!error && !result && (isStarting || !session || !frameLoaded) && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(120%_80%_at_50%_30%,#172554_0%,#0B1120_55%,#000_100%)]"
            >
              <GameLoader name={game.name} category={game.category} />
            </motion.div>
          )}
        </AnimatePresence>

        {error && !isStarting && (
          <div className="text-center px-6 max-w-sm">
            <Gamepad2 size={48} className="mx-auto mb-3 text-white/60" />
            <p className="text-white font-semibold mb-1">
              {session ? 'Couldn\'t save your session' : 'Can\'t start this game'}
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
            className="h-full w-full bg-black sm:rounded-xl sm:border sm:border-white/5"
            /* allow-same-origin only for HTTPS games on another origin: they get
               their own storage, never ours (see lib/games/embed-policy.ts). */
            sandbox={gameSandbox(
              canGrantGameStorage(session.embedOrigin, window.location.origin),
            )}
            allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
            referrerPolicy="no-referrer"
            onLoad={() => setFrameLoaded(true)}
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
                <PartyPopper className="w-14 h-14 sm:w-16 sm:h-16 text-[#F59E0B]" />
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
                {result.reason === 'TOO_SHORT' ? (
                  <Timer className="w-14 h-14 sm:w-16 sm:h-16 text-[#F59E0B]" />
                ) : (
                  <Ban className="w-14 h-14 sm:w-16 sm:h-16 text-[#EF4444]" />
                )}
                <h2 className="text-xl font-extrabold text-white">
                  {result.reason === 'TOO_SHORT' && 'A bit too short'}
                  {result.reason === 'CAP_REACHED' && 'Daily limit reached'}
                  {result.reason === 'PLAN_LIMIT' && "Today's games are used up"}
                  {result.reason === 'BUDGET_EXHAUSTED' && 'Sponsored rewards used up'}
                  {result.reason === 'DAILY_MAX' && "Today's earning maximum reached"}
                  {result.reason === 'FLAGGED' && 'Session not counted'}
                  {result.reason === 'ALREADY_CLAIMED' && 'Already claimed'}
                </h2>
                <p className="text-white/60 text-sm max-w-xs">
                  {result.reason === 'TOO_SHORT' &&
                    `Play at least ${formatClock(result.minPlaySeconds)} to earn a reward. You played ${formatClock(result.verifiedSeconds)}.`}
                  {result.reason === 'CAP_REACHED' &&
                    "You've earned everything available from this game today. Come back tomorrow."}
                  {result.reason === 'PLAN_LIMIT' &&
                    "You've reached your plan's rewarded games for today. Come back tomorrow or upgrade for more."}
                  {result.reason === 'FLAGGED' &&
                    "We couldn't verify this play session. Try playing again normally."}
                  {result.reason === 'BUDGET_EXHAUSTED' &&
                    "This game's sponsored rewards are used up for now. Try another game or come back later."}
                  {result.reason === 'DAILY_MAX' &&
                    "You've earned your plan's maximum for today. Come back tomorrow, or upgrade to earn more each day."}
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
  const { formatAmount } = useSystemCurrency();

  const [selectedCategory, setSelectedCategory] = useState<UICategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [page, setPage] = useState(1);
  const [allGames, setAllGames] = useState<Game[]>([]);

  const schemaCategory =
    selectedCategory === 'all' ? undefined : categoryMap[selectedCategory];

  // Today's rewarded-games quota for the user's plan.
  const { data: today, refetch: refetchToday } = useEarnToday();
  const gamesQuota = today?.tasks.find((t) => t.key === 'games');

  const { data, isLoading, error: listError, refetch } = useGames({
    category: schemaCategory,
    search: searchQuery,
    page,
    limit: 20,
  });

  // Memoize games to prevent unnecessary re-renders
  const games = useMemo(() => data?.games ?? [], [data?.games]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages;

  // Use useMemo to stabilize the games reference and fix the dependency warning
  const stableGames = useMemo(() => games, [games]);

  useEffect(() => {
    setAllGames((prev) =>
      page === 1 ? stableGames : [...prev, ...stableGames],
    );
  }, [stableGames, page]);

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
    void refetchToday();
  };

  const featured = allGames[0];

  return (
    <div className="space-y-5 font-outfit max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 px-3 py-1.5 rounded-full flex-shrink-0">
            <Trophy size={14} className="text-[#8B5CF6] dark:text-[#A78BFA]" />
            <span className="text-xs font-bold text-[#8B5CF6] dark:text-[#A78BFA] whitespace-nowrap">
              {total} games
            </span>
          </div>
          {gamesQuota && (
            <div className="flex items-center gap-1.5 bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-3 py-1.5 rounded-full flex-shrink-0">
              <span className="text-xs font-bold text-[#16A34A] dark:text-[#4ADE80] whitespace-nowrap">
                {gamesQuota.remaining}/{gamesQuota.limit} rewarded left today
              </span>
            </div>
          )}
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

      {gamesQuota && gamesQuota.remaining === 0 && (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] dark:bg-[#F59E0B]/10 dark:border-[#F59E0B]/30 p-3 text-sm text-[#92400E] dark:text-[#FBBF24]">
          You&apos;ve used today&apos;s {gamesQuota.limit} rewarded games. Come back
          tomorrow, or <a href="/plans" className="font-bold underline">upgrade</a> for more.
        </div>
      )}

      {listError && games.length === 0 && (
        <div className="text-center py-8 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155]">
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Couldn&apos;t load games. Check your connection.
          </p>
          <button onClick={() => refetch()} className="mt-3 text-sm font-semibold text-[#2563EB]">
            Try again
          </button>
        </div>
      )}

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
            <GameCategoryIcon
              category={featured.category}
              className="w-20 h-20 sm:w-24 sm:h-24"
            />
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
          <Gamepad2 size={48} className="mx-auto mb-3 text-[#94A3B8] dark:text-[#64748B]" />
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
                  <span className="relative z-10 drop-shadow-lg text-white">
                    <GameCategoryIcon
                      category={game.category}
                      className="w-10 h-10 sm:w-12 sm:h-12"
                    />
                  </span>
                )}
                {game.isSponsored && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0F172A] text-[10px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
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

      {/* Player: rendered on <body> so no app container (header, transformed
          page wrappers) can sit on top of it or clip it. */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedGame && (
              <GameFrame game={selectedGame} onClose={handleCloseGame} />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
