// src/app/api/public/stats/route.ts
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { videos } from '@/lib/db/schema/videos';
import { games } from '@/lib/db/schema/games';
import { transactions } from '@/lib/db/schema/wallet';
import { eq, sql, and } from 'drizzle-orm';

// This route stays dynamic (no static generation), but the expensive DB
// work behind it is cached and shared across requests — see getStats() below.
export const dynamic = 'force-dynamic';

const getStats = unstable_cache(
  async () => {
    // Run all five queries concurrently instead of one-after-another.
    const [
      totalUsersResult,
      totalVideosResult,
      totalGamesResult,
      totalRewardsResult,
      verifiedUsersResult,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(videos)
        .where(eq(videos.status, 'ACTIVE')),

      db
        .select({ count: sql<number>`count(*)` })
        .from(games)
        .where(eq(games.status, 'ACTIVE')),

      db
        .select({ total: sql<number>`sum(amount)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'COMPLETED'),
            eq(transactions.type, 'CREDIT'),
          ),
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.emailVerifiedAt} IS NOT NULL`),
    ]);

    const totalUsers = totalUsersResult[0]?.count || 0;
    const totalVideosWatched = totalVideosResult[0]?.count || 0;
    const totalGamesPlayed = totalGamesResult[0]?.count || 0;
    const totalRewardsPaid = totalRewardsResult[0]?.total || 0;
    const verifiedUsers = verifiedUsersResult[0]?.count || 0;

    const userSatisfaction =
      totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 98;

    return {
      totalUsers,
      totalVideosWatched,
      totalGamesPlayed,
      totalRewardsPaid,
      userSatisfaction,
    };
  },
  ['public-stats'], // cache key
  { revalidate: 30 }, // seconds — tune to how fresh you actually need this
);

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 },
    );
  }
}
