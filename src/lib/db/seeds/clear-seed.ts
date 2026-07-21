// src/lib/db/seeds/clear-seed.ts

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function clearAllData() {
  console.log('🗑️ Clearing all Boostly data from tables...');

  // Order matters due to foreign keys — child tables first
  const tables = [
    // ============================================
    // CONTENT (depends on users for createdBy)
    // ============================================
    'survey_responses',
    'survey_questions',
    'surveys',
    'game_plays',
    'games',
    'video_watches',
    'videos',

    // ============================================
    // CRYPTO (depends on users)
    // ============================================
    'crypto_withdrawals',
    'crypto_deposits',
    'crypto_wallets',
    'crypto_currencies',
    'crypto_rates',

    // ============================================
    // REWARDS & WALLET (depends on users)
    // ============================================
    'ad_watches',
    'daily_bonuses',
    'rewards',
    'withdrawals',
    'transactions',
    'wallets',

    // ============================================
    // EXCHANGE RATES (independent)
    // ============================================
    'exchange_rates',

    // ============================================
    // REFERRALS (depends on users)
    // ============================================
    'referrals',
    'referral_codes',

    // ============================================
    // BADGES & SUBSCRIPTIONS (depends on users)
    // ============================================
    'user_subscriptions',
    'user_badges',
    'subscription_plans',
    'badges',

    // ============================================
    // NOTIFICATIONS (depends on users)
    // ============================================
    'notifications',

    // ============================================
    // EMAIL LOGS (independent)
    // ============================================
    'email_logs',

    // ============================================
    // EXPORT HISTORY (depends on users)
    // ============================================
    'export_history',

    // ============================================
    // RBAC (depends on users, roles, permissions)
    // ============================================
    'user_roles',
    'role_permissions',

    // ============================================
    // AUTH (depends on users)
    // ============================================
    'audit_logs',
    'sudo_sessions',
    'two_fa_sessions',
    'sessions',
    'otp_verifications',

    // ============================================
    // USERS (independent but referenced by many)
    // ============================================
    'users',

    // ============================================
    // RBAC BASE TABLES
    // ============================================
    'permissions',
    'roles',

    // ============================================
    // COMPANY SETTINGS (independent)
    // ============================================
    'company_settings',

    // ============================================
    // INVOICE TEMPLATE SETTINGS (independent)
    // ============================================
    'invoice_template_settings',
  ];

  let clearedCount = 0;
  let skippedCount = 0;

  for (const table of tables) {
    try {
      await db.run(sql.raw(`DELETE FROM ${table}`));
      clearedCount++;
      console.log(`  ✅ Cleared ${table}`);
    } catch (error) {
      skippedCount++;
      console.log(
        `  ⚠️ Could not clear ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Reset SQLite sequences
  for (const table of tables) {
    try {
      await db.run(
        sql.raw(`DELETE FROM sqlite_sequence WHERE name = '${table}'`),
      );
    } catch {
      // Ignore — not all tables use auto-increment
    }
  }

  console.log(`\n🎉 Cleared ${clearedCount} tables, skipped ${skippedCount}`);
}

// Run if executed directly
if (require.main === module) {
  clearAllData().catch(console.error);
}
