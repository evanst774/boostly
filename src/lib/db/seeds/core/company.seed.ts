// src/lib/db/seeds/company-seed.ts

import { db } from '@/lib/db';
import {
  companySettings,
  getDefaultCompanySettings,
  type CompanySettings,
} from '@/lib/db/schema/company';
import { FIAT_CURRENCY_LIST } from '@/lib/db/schema/currency';
import { eq } from 'drizzle-orm';
import type { SeedCompanyResult } from '../types';

// // Helper to safely check if a property exists in an object
// function hasProperty<T extends object, K extends string>(
//   obj: T,
//   prop: K,
// ): obj is T & Record<K, unknown> {
//   return obj !== null && typeof obj === 'object' && prop in obj;
// }

export async function seedCompany(): Promise<SeedCompanyResult> {
  console.log('  🏢 Seeding Boostly company settings...');

  const existingSettings = await db.query.companySettings.findFirst({
    where: eq(companySettings.id, 'single'),
  });

  let company: CompanySettings | undefined;

  if (!existingSettings) {
    const defaultSettings = getDefaultCompanySettings();

    const [settings] = await db
      .insert(companySettings)
      .values({
        ...defaultSettings,
        // Override with Boostly-specific values
        companyName: 'Boostly Rwanda Ltd',
        phone: '+250 788 123 456',
        email: 'info@boostly.buzz',
        address: 'KG 120 St, Kigali, Rwanda',
        city: 'Kigali',
        country: 'Rwanda',
        postalCode: '00000',
        website: 'https://boostly.buzz',
        description:
          'Boostly is a rewards platform where users earn money by watching videos, playing games, and completing tasks.',
        // Use RWF as base currency for Rwanda
        baseCurrency: 'RWF',
        baseCurrencySymbol: 'FRw',
        currency: 'RWF',
        currencySymbol: 'FRw',
        fromName: 'Boostly',
        fromEmail: 'noreply@boostly.buzz',
        replyTo: 'support@boostly.buzz',
        // Use all currencies from currency.ts
        supportedCurrencies: FIAT_CURRENCY_LIST,
      })
      .returning();

    company = settings;
    console.log('    ✅ Created Boostly company settings with defaults');
    console.log(`    📊 Supported ${FIAT_CURRENCY_LIST.length} currencies`);
  } else {
    company = existingSettings;
    console.log('    ⚠️ Company settings already exist');

    // Update existing settings with any missing fields
    const updates: Partial<typeof companySettings.$inferInsert> = {};

    // Add new currency fields if missing
    if (!existingSettings.baseCurrency) updates.baseCurrency = 'RWF';
    if (!existingSettings.baseCurrencySymbol)
      updates.baseCurrencySymbol = 'FRw';

    // Update supported currencies to include all currencies if missing or outdated
    if (
      !existingSettings.supportedCurrencies ||
      existingSettings.supportedCurrencies.length < FIAT_CURRENCY_LIST.length
    ) {
      updates.supportedCurrencies = FIAT_CURRENCY_LIST;
    }

    if (!existingSettings.autoUpdateRates) updates.autoUpdateRates = true;
    if (!existingSettings.rateUpdateInterval) updates.rateUpdateInterval = 3600;
    if (!existingSettings.rateProvider)
      updates.rateProvider = 'exchangerate-api';
    if (!existingSettings.cryptoEnabled) updates.cryptoEnabled = false;
    if (!existingSettings.cryptoAutoUpdateRates)
      updates.cryptoAutoUpdateRates = true;
    if (!existingSettings.supportedCryptoCurrencies) {
      updates.supportedCryptoCurrencies = [
        'BTC',
        'ETH',
        'USDT',
        'USDC',
        'SOL',
        'XRP',
        'ADA',
        'DOT',
        'AVAX',
        'MATIC',
      ];
    }
    if (!existingSettings.customRates) updates.customRates = {};
    if (!existingSettings.timeFormat) updates.timeFormat = 'HH:mm';
    if (!existingSettings.weekStartDay) updates.weekStartDay = 1;

    // Update notifications if missing new fields - safely handle with type guard
    const notifications = existingSettings.notifications as
      | Record<string, unknown>
      | null
      | undefined;
    if (notifications && typeof notifications === 'object') {
      const currentNotif = notifications;
      if (!('dailySummary' in currentNotif)) {
        updates.notifications = {
          email: (currentNotif.email as boolean) ?? true,
          inApp: (currentNotif.inApp as boolean) ?? true,
          sms: (currentNotif.sms as boolean) ?? false,
          lowStock: (currentNotif.lowStock as boolean) ?? true,
          overduePayment: (currentNotif.overduePayment as boolean) ?? true,
          newSale: (currentNotif.newSale as boolean) ?? true,
          dailySummary: true,
          weeklyReport: true,
          monthlyReport: true,
          withdrawalAlerts: true,
          cryptoDepositAlerts: true,
        };
      }
    }

    // Update features if missing - safely handle with type guard
    const features = existingSettings.features as
      | Record<string, unknown>
      | null
      | undefined;
    if (features && typeof features === 'object') {
      const currentFeatures = features;
      if (
        !('leaderboard' in currentFeatures) ||
        !('dailyBonus' in currentFeatures)
      ) {
        updates.features = {
          referrals: (currentFeatures.referrals as boolean) ?? true,
          badges: (currentFeatures.badges as boolean) ?? true,
          subscriptions: (currentFeatures.subscriptions as boolean) ?? true,
          crypto: (currentFeatures.crypto as boolean) ?? false,
          ads: (currentFeatures.ads as boolean) ?? true,
          games: (currentFeatures.games as boolean) ?? true,
          surveys: (currentFeatures.surveys as boolean) ?? true,
          videos: (currentFeatures.videos as boolean) ?? true,
          leaderboard: true,
          dailyBonus: true,
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(companySettings)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(companySettings.id, 'single'));
      console.log('    ✅ Updated existing company settings with new fields');
      if (updates.supportedCurrencies) {
        console.log(
          `    📊 Now supporting ${FIAT_CURRENCY_LIST.length} currencies`,
        );
      }
    } else {
      console.log('    ✅ Company settings are up to date');
    }
  }

  return { company };
}
