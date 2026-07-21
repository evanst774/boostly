// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { walletService } from '@/modules/wallet/service';
import { rewardsService, dailyBonusesService } from '@/modules/rewards/service';
import {
  videosService,
  gamesService,
  surveysService,
} from '@/modules/content/services';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get wallet stats
    const walletStats = await walletService.getWalletStats(user.id);

    // Get earnings stats
    const earningsStats = await rewardsService.getUserEarningsStats(user.id);

    // Get earnings by type
    const earningsByType = await rewardsService.getEarningsByType(user.id);

    // Get streak info
    const streakInfo = await dailyBonusesService.getStreakInfo(user.id);

    // Get today's bonus
    const todayBonus = await dailyBonusesService.getOrCreateTodayBonus(user.id);

    // Get recent transactions - returns array directly
    const recentTransactions = await walletService.getRecentTransactions(
      user.id,
      5,
    );

    // Get active content counts
    const activeVideos = await videosService.getActiveVideos();
    const activeGames = await gamesService.getActiveGames();
    const activeSurveys = await surveysService.getActiveSurveys();

    return NextResponse.json({
      wallet: walletStats,
      earnings: earningsStats,
      earningsByType,
      streak: streakInfo,
      todayBonus,
      recentTransactions: recentTransactions,
      content: {
        videos: activeVideos.length,
        games: activeGames.length,
        surveys: activeSurveys.length,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
