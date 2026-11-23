// src/modules/rewards/budget.service.ts
//
// The money side of rewards: how much the platform will pay per day (set by
// an admin from real revenue) and how much each sponsor campaign has left.
import { and, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companySettings, games, rewards, surveys, videos } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/permissions';
import { getCurrentUser } from '@/lib/auth/session.server';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { createAuditLog } from '@/lib/audit';
import { kigaliDayStartIso } from '@/lib/constants/payouts';

const BUDGETED = ['VIDEO', 'GAME', 'SURVEY', 'AD_WATCH', 'DAILY_BONUS'] as const;

export async function getRewardBudgetStatus() {
  await requirePermission(PermissionKeys.ADMIN_SETTINGS);
  const [settings, spent, v, g, s] = await Promise.all([
    db.query.companySettings.findFirst({
      where: eq(companySettings.id, 'single'),
      columns: { dailyRewardBudget: true },
    }),
    db
      .select({ n: sql<number>`coalesce(sum(${rewards.amount}), 0)` })
      .from(rewards)
      .where(
        and(
          eq(rewards.status, 'CLAIMED'),
          gte(rewards.createdAt, kigaliDayStartIso()),
          inArray(rewards.type, [...BUDGETED]),
        ),
      ),
    db.select({ id: videos.id, title: videos.title, budget: videos.rewardBudget, spent: videos.rewardSpent }).from(videos).where(isNotNull(videos.rewardBudget)),
    db.select({ id: games.id, title: games.name, budget: games.rewardBudget, spent: games.rewardSpent }).from(games).where(isNotNull(games.rewardBudget)),
    db.select({ id: surveys.id, title: surveys.title, budget: surveys.rewardBudget, spent: surveys.rewardSpent }).from(surveys).where(isNotNull(surveys.rewardBudget)),
  ]);
  const daily = settings?.dailyRewardBudget ?? null;
  const spentToday = Number(spent[0]?.n ?? 0);
  const campaigns = [
    ...v.map((c) => ({ ...c, kind: 'Video' })),
    ...g.map((c) => ({ ...c, kind: 'Game' })),
    ...s.map((c) => ({ ...c, kind: 'Survey' })),
  ]
    .map((c) => ({ ...c, budget: Number(c.budget), spent: Number(c.spent ?? 0), remaining: Math.max(0, Number(c.budget) - Number(c.spent ?? 0)) }))
    .sort((a, b) => a.remaining - b.remaining);
  return {
    dailyRewardBudget: daily,
    spentToday,
    remainingToday: daily === null ? null : Math.max(0, daily - spentToday),
    campaigns,
  };
}

export async function setDailyRewardBudget(amount: number | null) {
  await requirePermission(PermissionKeys.ADMIN_SETTINGS);
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  if (amount !== null && !(Number.isFinite(amount) && amount >= 0)) {
    throw new Error('Enter a budget of 0 RWF or more');
  }
  const value = amount === null ? null : Math.round(amount);
  const updated = await db
    .update(companySettings)
    .set({ dailyRewardBudget: value, updatedAt: new Date().toISOString() })
    .where(eq(companySettings.id, 'single'))
    .returning({ id: companySettings.id });
  if (updated.length === 0) {
    await db.insert(companySettings).values({ id: 'single', dailyRewardBudget: value });
  }
  await createAuditLog({
    userId: user.id,
    action: 'PAYMENT_SETTINGS_UPDATED',
    entityType: 'company_settings',
    entityId: 'single',
    newData: { dailyRewardBudget: value },
  });
  return getRewardBudgetStatus();
}
