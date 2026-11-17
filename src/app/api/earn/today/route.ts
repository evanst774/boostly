// src/app/api/earn/today/route.ts
//
// Everything the user dashboard needs in one request: plan, today's task
// quotas and usage, wallet, withdrawal eligibility and recent activity.
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { RewardTypeEnum, transactions, wallets } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { rewardsService, dailyBonusesService } from '@/modules/rewards/service';
import { getUserPlan } from '@/modules/rewards/plan-limits';
import { getWithdrawalEligibility } from '@/modules/wallet/withdrawal-policy';
import { TIERS } from '@/lib/constants/tiers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      plan,
      wallet,
      todayEarnings,
      videosDone,
      gamesDone,
      surveysDone,
      earnings,
      eligibility,
      streak,
      recent,
    ] = await Promise.all([
      getUserPlan(user.id),
      db.query.wallets.findFirst({ where: eq(wallets.userId, user.id) }),
      rewardsService.getTodayEarnings(user.id),
      rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.VIDEO),
      rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.GAME),
      rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.SURVEY),
      rewardsService.getUserEarningsStats(user.id),
      getWithdrawalEligibility(user.id),
      dailyBonusesService.getStreakInfo(user.id).catch(() => null),
      db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, user.id))
        .orderBy(desc(transactions.createdAt))
        .limit(6),
    ]);

    const tierMeta = TIERS[plan.tier]?.metadata ?? TIERS.FREE.metadata;

    const tasks = [
      {
        key: 'videos',
        label: 'Watch sponsored videos',
        href: '/earn/videos',
        done: videosDone,
        limit: plan.limits.maxDailyVideos,
      },
      {
        key: 'games',
        label: 'Play games',
        href: '/earn/games',
        done: gamesDone,
        limit: plan.limits.maxDailyGames,
      },
      {
        key: 'surveys',
        label: 'Answer surveys',
        href: '/earn/surveys',
        done: surveysDone,
        limit: plan.limits.maxDailySurveys,
      },
    ].map((t) => ({ ...t, remaining: Math.max(0, t.limit - t.done) }));

    return NextResponse.json({
      plan: {
        tier: plan.tier,
        name: plan.name,
        isFree: plan.isFree,
        expiresAt: plan.expiresAt,
        estimatedDailyEarnings: tierMeta.estimatedDailyEarnings,
      },
      tasks,
      totals: {
        done: tasks.reduce((s, t) => s + t.done, 0),
        limit: tasks.reduce((s, t) => s + t.limit, 0),
      },
      wallet: {
        balance: wallet?.balance ?? 0,
        pendingWithdrawal: wallet?.pendingWithdrawal ?? 0,
        totalEarned: wallet?.totalEarned ?? 0,
        totalWithdrawn: wallet?.totalWithdrawn ?? 0,
        currency: wallet?.defaultCurrency ?? 'RWF',
      },
      earnings: { ...earnings, today: todayEarnings },
      streak: {
        current: streak?.currentStreak ?? 0,
        nextMilestone: streak?.nextMilestone ?? null,
      },
      withdrawal: eligibility,
      recentTransactions: recent,
    });
  } catch (error) {
    console.error('Earn today error:', error);
    return NextResponse.json(
      { error: 'Failed to load your dashboard' },
      { status: 500 },
    );
  }
}
