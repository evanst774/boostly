// src/lib/db/seeds/content/games.seed.ts
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  games,
  GameCategoryEnum,
  GameProviderEnum,
  GameStatusEnum,
  getGameEmbedOrigin,
  type Game,
  type NewGame,
} from '@/lib/db/schema';

/**
 * Base URL for self-hosted game builds in R2.
 * Every entry below assumes `<CDN>/<slug>/index.html` exists. If it doesn't,
 * the iframe renders a 404 page while the heartbeat keeps accruing rewardable
 * time — the user gets paid real RWF for staring at nothing.
 */
const GAMES_CDN =
  process.env.NEXT_PUBLIC_GAMES_CDN_URL ?? 'https://games.boostly.buzz';

/**
 * REWARD BUDGET
 *
 * maxRewardedSecondsPerDay is set explicitly on every game. Leaving it to the
 * 600s default across a catalogue this size authorises roughly 10,800 RWF per
 * user per day from games alone — about $8/user/day before videos and surveys.
 *
 * These numbers total 200 RWF/user/day for the six unsponsored games, plus
 * 240 RWF/user/day across the three sponsored ones — and the sponsored portion
 * should be funded by the brand, not by you. Raise any of it only once you have
 * measured revenue per user, not before.
 *
 * The seed prints the running total when it finishes. Watch that number.
 *
 * Per-game daily ceiling =
 *   min(maxRewardedSecondsPerDay / minPlayDuration * baseReward,
 *       maxReward * maxPlaysPerDay)
 */
type GameSeed = Omit<NewGame, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

export const gameData: GameSeed[] = [
  // ============================================
  // REGULAR GAMES — ~15 RWF/user/day each
  // ============================================
  {
    name: 'Bubble Pop',
    description: 'Pop all bubbles before time runs out for maximum rewards.',
    category: GameCategoryEnum.PUZZLE,
    icon: '🫧',
    thumbnailUrl: `${GAMES_CDN}/bubble-pop/thumb.png`,
    thumbnailKey: 'games/bubble-pop/thumb.png',
    gameUrl: `${GAMES_CDN}/bubble-pop/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 15,
    maxReward: 30,
    minPlayDuration: 60,
    maxPlaysPerDay: 3,
    maxRewardedSecondsPerDay: 120, // -> 30 RWF/day
    difficulty: 1,
    isSponsored: false,
  },
  {
    name: 'Fruit Slash',
    description: 'Slice fruits and earn points. Be careful not to miss!',
    category: GameCategoryEnum.ACTION,
    icon: '🍎',
    thumbnailUrl: `${GAMES_CDN}/fruit-slash/thumb.png`,
    thumbnailKey: 'games/fruit-slash/thumb.png',
    gameUrl: `${GAMES_CDN}/fruit-slash/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 15,
    maxReward: 30,
    minPlayDuration: 60,
    maxPlaysPerDay: 3,
    maxRewardedSecondsPerDay: 120,
    difficulty: 2,
    isSponsored: false,
  },
  {
    name: 'Space Run',
    description: 'Run through space and collect stars for bonus points.',
    category: GameCategoryEnum.ACTION,
    icon: '🚀',
    thumbnailUrl: `${GAMES_CDN}/space-run/thumb.png`,
    thumbnailKey: 'games/space-run/thumb.png',
    gameUrl: `${GAMES_CDN}/space-run/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 20,
    maxReward: 40,
    minPlayDuration: 90,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 180,
    difficulty: 3,
    isSponsored: false,
  },
  {
    name: 'Quiz Master',
    description: 'Test your knowledge with trivia questions.',
    category: GameCategoryEnum.QUIZ,
    icon: '🧠',
    thumbnailUrl: `${GAMES_CDN}/quiz-master/thumb.png`,
    thumbnailKey: 'games/quiz-master/thumb.png',
    gameUrl: `${GAMES_CDN}/quiz-master/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 20,
    maxReward: 40,
    minPlayDuration: 90,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 180,
    difficulty: 2,
    isSponsored: false,
  },
  {
    name: 'Card Match',
    description: 'Match pairs of cards to earn rewards.',
    category: GameCategoryEnum.PUZZLE,
    icon: '🃏',
    thumbnailUrl: `${GAMES_CDN}/card-match/thumb.png`,
    thumbnailKey: 'games/card-match/thumb.png',
    gameUrl: `${GAMES_CDN}/card-match/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 15,
    maxReward: 30,
    minPlayDuration: 60,
    maxPlaysPerDay: 3,
    maxRewardedSecondsPerDay: 120,
    difficulty: 1,
    isSponsored: false,
  },
  {
    name: 'Word Search',
    description: 'Find hidden words in a grid of letters.',
    category: GameCategoryEnum.PUZZLE,
    icon: '🔍',
    thumbnailUrl: `${GAMES_CDN}/word-search/thumb.png`,
    thumbnailKey: 'games/word-search/thumb.png',
    gameUrl: `${GAMES_CDN}/word-search/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 15,
    maxReward: 30,
    minPlayDuration: 90,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 180,
    difficulty: 2,
    isSponsored: false,
  },
  {
    name: 'Racing Car',
    description: 'Race against time and traffic to set the best lap.',
    category: GameCategoryEnum.RACING,
    icon: '🏎️',
    thumbnailUrl: `${GAMES_CDN}/racing-car/thumb.png`,
    thumbnailKey: 'games/racing-car/thumb.png',
    gameUrl: `${GAMES_CDN}/racing-car/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 20,
    maxReward: 40,
    minPlayDuration: 90,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 180,
    difficulty: 3,
    isSponsored: false,
  },
  {
    name: 'Math Challenge',
    description: 'Solve quick arithmetic puzzles against the clock.',
    category: GameCategoryEnum.QUIZ,
    icon: '➗',
    thumbnailUrl: `${GAMES_CDN}/math-challenge/thumb.png`,
    thumbnailKey: 'games/math-challenge/thumb.png',
    gameUrl: `${GAMES_CDN}/math-challenge/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 20,
    maxReward: 40,
    minPlayDuration: 90,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 180,
    difficulty: 2,
    isSponsored: false,
  },

  // ============================================
  // SPONSORED GAMES — higher payout, funded by the brand
  // ============================================
  {
    name: 'MTN Rwanda: Network Speed Challenge',
    description: 'Test your reaction speed and win MTN data bundles!',
    category: GameCategoryEnum.ACTION,
    icon: '📶',
    thumbnailUrl: `${GAMES_CDN}/mtn-speed-challenge/thumb.png`,
    thumbnailKey: 'games/mtn-speed-challenge/thumb.png',
    gameUrl: `${GAMES_CDN}/mtn-speed-challenge/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 40,
    maxReward: 80,
    minPlayDuration: 60,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 120, // -> 80 RWF/day
    difficulty: 2,
    isSponsored: true,
    sponsorName: 'MTN Rwanda',
    sponsorLogo: `${GAMES_CDN}/sponsors/mtn-logo.png`,
    sponsorWebsite: 'https://mtn.rw',
    sponsoredUntil: daysFromNow(30),
  },
  {
    name: 'Bank of Kigali: Finance Quiz',
    description: 'Learn about financial literacy while earning rewards.',
    category: GameCategoryEnum.QUIZ,
    icon: '💰',
    thumbnailUrl: `${GAMES_CDN}/bk-finance-quiz/thumb.png`,
    thumbnailKey: 'games/bk-finance-quiz/thumb.png',
    gameUrl: `${GAMES_CDN}/bk-finance-quiz/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 50,
    maxReward: 100,
    minPlayDuration: 90,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 180,
    difficulty: 3,
    isSponsored: true,
    sponsorName: 'Bank of Kigali',
    sponsorLogo: `${GAMES_CDN}/sponsors/bk-logo.png`,
    sponsorWebsite: 'https://bk.rw',
    sponsoredUntil: daysFromNow(45),
  },
  {
    name: 'Carrefour Rwanda: Shopping Memory',
    description: 'Match products and win Carrefour shopping vouchers.',
    category: GameCategoryEnum.PUZZLE,
    icon: '🛒',
    thumbnailUrl: `${GAMES_CDN}/carrefour-memory/thumb.png`,
    thumbnailKey: 'games/carrefour-memory/thumb.png',
    gameUrl: `${GAMES_CDN}/carrefour-memory/index.html`,
    provider: GameProviderEnum.SELF_HOSTED,
    baseReward: 30,
    maxReward: 60,
    minPlayDuration: 90,
    maxPlaysPerDay: 2,
    maxRewardedSecondsPerDay: 180,
    difficulty: 2,
    isSponsored: true,
    sponsorName: 'Carrefour Rwanda',
    sponsorLogo: `${GAMES_CDN}/sponsors/carrefour-logo.png`,
    sponsorWebsite: 'https://carrefour.rw',
    sponsoredUntil: daysFromNow(60),
  },
];

// ============================================
// HELPERS
// ============================================

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Worst case a single user can earn from this game in one day. */
export function maxDailyCost(game: GameSeed): number {
  const byTimeCap =
    (game.maxRewardedSecondsPerDay! / game.minPlayDuration!) * game.baseReward!;
  const byPlayCap = game.maxReward! * game.maxPlaysPerDay!;
  return Math.round(Math.min(byTimeCap, byPlayCap));
}

// ============================================
// SEED
// ============================================

export async function seedGames(): Promise<Game[]> {
  console.log('  🎮 Seeding games...');
  const gameList: Game[] = [];

  for (const game of gameData) {
    const existing = await db.query.games.findFirst({
      where: eq(games.name, game.name),
    });

    if (existing) {
      gameList.push(existing);
      console.log(`    ⚠️  Game exists: ${game.name}`);
      continue;
    }

    // ✅ Validate gameUrl before inserting
    const embedOrigin = getGameEmbedOrigin(game.gameUrl ?? null);
    if (!embedOrigin) {
      console.warn(
        `    ⚠️  Invalid gameUrl for ${game.name}: "${game.gameUrl}" — skipping`,
      );
      continue;
    }

    const [newGame] = await db
      .insert(games)
      .values({
        ...game,
        /**
         * ✅ ACTIVE — games are ready to play immediately after seeding.
         * 
         * This assumes all game builds are already uploaded and verified.
         * If you need to verify builds first, change to DRAFT and publish manually.
         */
        status: GameStatusEnum.ACTIVE,
        // Stats start at zero. Seeding random play counts makes analytics untrustworthy.
        totalPlays: 0,
        totalPlayers: 0,
        likes: 0,
        shares: 0,
      })
      .returning();

    gameList.push(newGame);
    console.log(
      `    ✅ ${game.name}${game.isSponsored ? ' (Sponsored)' : ''} — max ${maxDailyCost(game)} RWF/user/day`,
    );
  }

  // ---- Budget summary ----
  const dailyCeiling = gameData.reduce((sum, g) => sum + maxDailyCost(g), 0);
  const sponsoredCount = gameList.filter((g) => g.isSponsored).length;
  const activeCount = gameList.filter((g) => g.status === GameStatusEnum.ACTIVE).length;

  console.log(
    `    📊 ${gameList.length} games seeded (${sponsoredCount} sponsored, ${activeCount} active)`,
  );
  console.log(
    `    💸 Worst-case exposure: ${dailyCeiling} RWF per user per day across the catalogue`,
  );

  // ---- URL sanity check ----
  const badUrls = gameData.filter(
    (g) => !getGameEmbedOrigin(g.gameUrl ?? null),
  );
  if (badUrls.length > 0) {
    console.warn(
      `    ⚠️  ${badUrls.length} game(s) have an invalid gameUrl and were skipped: ${badUrls
        .map((g) => g.name)
        .join(', ')}`,
    );
  }
  console.log(
    `    ℹ️  Verify each build loads at ${GAMES_CDN}/<slug>/index.html before publishing.`,
  );

  return gameList;
}