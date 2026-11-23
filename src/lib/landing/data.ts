// src/lib/landing/data.ts
//
// Everything the public landing page shows, read on the server and cached for
// five minutes. Only public-safe fields: no user ids, emails or phones, and
// member names are masked ("Jean N.").
import { unstable_cache } from 'next/cache';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  games,
  rewards,
  surveys,
  users,
  videos,
  withdrawals,
} from '@/lib/db/schema';
import { publicDisplayName } from '@/lib/privacy';

export interface ShowcaseVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
  reward: number;
  category: string;
  sponsor: string | null;
}

export interface ShowcaseGame {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  icon: string | null;
  reward: number;
  category: string;
}

export interface ShowcaseSurvey {
  id: string;
  title: string;
  brand: string;
  reward: number;
  minutes: number;
  questions: number;
}

export interface RecentPayout {
  id: string;
  name: string;
  amount: number;
  at: string;
}

export interface LandingStats {
  /** Active member accounts. */
  members: number;
  /** RWF credited for completed tasks (videos, games, surveys, bonuses). */
  rewardsPaid: number;
  /** RWF actually sent to members' mobile money. */
  withdrawn: number;
  /** Video, game and survey tasks completed and paid. */
  tasksCompleted: number;
}

export interface LandingData {
  videos: ShowcaseVideo[];
  games: ShowcaseGame[];
  surveys: ShowcaseSurvey[];
  payouts: RecentPayout[];
  stats: LandingStats;
}

const EMPTY: LandingData = {
  videos: [],
  games: [],
  surveys: [],
  payouts: [],
  stats: { members: 0, rewardsPaid: 0, withdrawn: 0, tasksCompleted: 0 },
};

const load = unstable_cache(
  async (): Promise<LandingData> => {
    const now = new Date().toISOString();
    const [v, g, s, p, members, paid, withdrawn, tasks] = await Promise.all([
      db
        .select({
          id: videos.id,
          title: videos.title,
          thumbnailUrl: videos.thumbnailUrl,
          duration: videos.duration,
          reward: videos.rewardAmount,
          category: videos.category,
          sponsor: videos.sponsorName,
        })
        .from(videos)
        .where(eq(videos.status, 'ACTIVE'))
        .orderBy(desc(videos.isSponsored), desc(videos.createdAt))
        .limit(14),
      db
        .select({
          id: games.id,
          name: games.name,
          thumbnailUrl: games.thumbnailUrl,
          icon: games.icon,
          reward: games.baseReward,
          category: games.category,
        })
        .from(games)
        .where(eq(games.status, 'ACTIVE'))
        .orderBy(desc(games.totalPlays))
        .limit(14),
      db
        .select({
          id: surveys.id,
          title: surveys.title,
          brand: surveys.brand,
          reward: surveys.rewardAmount,
          minutes: surveys.estimatedTime,
          questions: surveys.questionsCount,
        })
        .from(surveys)
        .where(
          and(
            eq(surveys.status, 'ACTIVE'),
            sql`(${surveys.endsAt} IS NULL OR ${surveys.endsAt} > ${now})`,
          ),
        )
        .orderBy(desc(surveys.rewardAmount))
        .limit(8),
      db
        .select({
          id: withdrawals.id,
          amount: withdrawals.amount,
          at: withdrawals.completedAt,
          name: users.name,
        })
        .from(withdrawals)
        .leftJoin(users, eq(withdrawals.userId, users.id))
        .where(
          and(
            eq(withdrawals.status, 'COMPLETED'),
            // Members can opt out of public lists (Settings > Privacy).
            sql`coalesce(json_extract(${users.preferences}, '$.showOnLeaderboard'), 1) != 0`,
          ),
        )
        .orderBy(desc(withdrawals.completedAt))
        .limit(6),
      db
        .select({ n: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true)),
      db
        .select({ n: sql<number>`coalesce(sum(${rewards.amount}), 0)` })
        .from(rewards)
        .where(eq(rewards.status, 'CLAIMED')),
      db
        .select({ n: sql<number>`coalesce(sum(${withdrawals.amount}), 0)` })
        .from(withdrawals)
        .where(eq(withdrawals.status, 'COMPLETED')),
      db
        .select({ n: sql<number>`count(*)` })
        .from(rewards)
        .where(
          and(
            eq(rewards.status, 'CLAIMED'),
            inArray(rewards.type, ['VIDEO', 'GAME', 'SURVEY']),
          ),
        ),
    ]);

    return {
      videos: v.map((x) => ({ ...x, reward: Number(x.reward) || 0 })),
      games: g.map((x) => ({ ...x, reward: Number(x.reward) || 0 })),
      surveys: s.map((x) => ({ ...x, reward: Number(x.reward) || 0 })),
      payouts: p
        .filter((x) => x.at)
        .map((x) => ({
          id: x.id,
          name: publicDisplayName(x.name),
          amount: x.amount,
          at: x.at as string,
        })),
      stats: {
        members: Number(members[0]?.n ?? 0),
        rewardsPaid: Number(paid[0]?.n ?? 0),
        withdrawn: Number(withdrawn[0]?.n ?? 0),
        tasksCompleted: Number(tasks[0]?.n ?? 0),
      },
    };
  },
  ['landing-data-v1'],
  { revalidate: 300 },
);

/** Never throws: the landing page must render even if the DB is unreachable. */
export async function getLandingData(): Promise<LandingData> {
  try {
    return await load();
  } catch (error) {
    console.error('Landing data unavailable:', error);
    return EMPTY;
  }
}
