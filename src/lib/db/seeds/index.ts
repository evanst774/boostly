// src/lib/db/seeds/index.ts
import { seedRBAC } from './core';
import { seedCompany } from './core/company.seed';
import { seedUsers } from './users/users.seed';
import { seedContent } from './content';
import { seedBadges } from './gamification/badges-subscriptions.seed';
import { seedExchangeRates } from './wallet/exchange-rates.seed';
import { seedCrypto } from './wallet/crypto.seed';
import { seedWallet } from './wallet/wallet.seed';
import { seedReferrals } from './social/referrals.seed';
import { seedRewards } from './rewards/rewards.seed';

export async function runAllSeeds() {
  console.log('🚀 Starting Boostly database seeds...');
  console.log('========================================');

  try {
    // STEP 1: Core (RBAC first)
    console.log('\n📋 Step 1: Seeding RBAC...');
    const rbac = await seedRBAC();

    // STEP 2: Company Settings
    console.log('\n🏢 Step 2: Seeding Company Settings...');
    const company = await seedCompany();

    // STEP 3: Users
    console.log('\n👤 Step 3: Seeding Users...');
    const users = await seedUsers();

    // STEP 4: Exchange Rates
    console.log('\n💱 Step 4: Seeding Exchange Rates...');
    const exchangeRates = await seedExchangeRates();

    // STEP 5: Crypto
    console.log('\n₿ Step 5: Seeding Crypto...');
    const crypto = await seedCrypto();

    // STEP 6: Content
    console.log('\n📺 Step 6: Seeding Content...');
    const content = await seedContent();

    // STEP 7: Badges & Subscriptions
    console.log('\n🏅 Step 7: Seeding Badges & Subscriptions...');
    const badges = await seedBadges();

    // STEP 8: Referrals
    console.log('\n👥 Step 8: Seeding Referrals...');
    const referrals = await seedReferrals();

    // STEP 9: Wallet
    console.log('\n💰 Step 9: Seeding Wallet...');
    const wallet = await seedWallet();

    // STEP 10: Rewards
    console.log('\n🎁 Step 10: Seeding Rewards...');
    const rewards = await seedRewards();

    console.log('\n========================================');
    console.log('🎉 Boostly seed process completed successfully!');
    console.log('\n📌 Seed Summary:');
    console.log(`   ✅ Super Admin: ${rbac.adminUser.email}`);
    console.log(`   ✅ Regular User: ${rbac.regularUser.email}`);
    console.log(`   ✅ ${users.count} users seeded`);
    console.log(`   ✅ ${content.videos.length} videos`);
    console.log(`   ✅ ${content.games.length} games`);
    console.log(`   ✅ ${content.surveys.length} surveys`);
    console.log(`   ✅ ${badges.badges.length} badges`);
    console.log(`   ✅ ${badges.subscriptionPlans.length} subscription plans`);
    console.log(`   ✅ ${crypto.currencies.length} crypto currencies`);
    console.log(`   ✅ ${referrals.codes.length} referral codes`);
    console.log(`   ✅ ${wallet.wallets.length} wallets`);
    console.log(`   ✅ ${rewards.rewards.length} rewards`);

    return { rbac, company, users, exchangeRates, crypto, content, badges, referrals, wallet, rewards };
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runAllSeeds().catch(console.error);
}