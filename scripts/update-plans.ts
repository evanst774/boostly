// scripts/update-plans.ts
//
// Brings the subscription_plans table in line with lib/constants/tiers.ts:
// the seven plans, their prices, daily task limits, reward-per-task boost and
// features. Matches rows by tier, so existing plan ids (and every
// subscription / payment that points at them) are kept. Safe to re-run.
//
//   dry run:  npx dotenv -e .env.production -- tsx scripts/update-plans.ts
//   apply:    npx dotenv -e .env.production -- tsx scripts/update-plans.ts --apply
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { subscriptionPlans } from '../src/lib/db/schema';
import { TIERS, TIER_ORDER, TIER_PRICES } from '../src/lib/constants/tiers';

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'APPLYING plan changes' : 'DRY RUN (add --apply to write)');

  for (const tier of TIER_ORDER) {
    const t = TIERS[tier];
    const price = TIER_PRICES[tier];
    const values = {
      name: `${t.label} Plan`,
      description: t.description,
      tier,
      priceMonthly: price.monthly,
      priceYearly: price.yearly,
      dailyEarnings: 0,
      features: t.features,
      maxDailyVideos: t.metadata.maxDailyVideos,
      maxDailyGames: t.metadata.maxDailyGames,
      maxDailyAds: t.metadata.maxDailyAds,
      maxDailySurveys: t.metadata.maxDailySurveys,
      badgeBoost: t.metadata.badgeBoost,
      priorityWithdrawal: t.metadata.priorityWithdrawal,
      vipSupport: t.metadata.vipSupport,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };
    const existing = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.tier, tier) });
    const summary = `${values.name.padEnd(15)} ${String(price.monthly).padStart(7)} RWF/mo  videos ${values.maxDailyVideos}  games ${values.maxDailyGames}  surveys ${values.maxDailySurveys}  x${(1 + values.badgeBoost).toFixed(1)}`;
    if (existing) {
      console.log(`update  ${summary}${existing.name !== values.name ? `  (was "${existing.name}")` : ''}`);
      if (apply) await db.update(subscriptionPlans).set(values).where(eq(subscriptionPlans.id, existing.id));
    } else {
      console.log(`create  ${summary}`);
      if (apply) await db.insert(subscriptionPlans).values(values);
    }
  }
  console.log(apply ? 'Done.' : 'Nothing written.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
