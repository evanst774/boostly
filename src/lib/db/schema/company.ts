// src/lib/db/schema/company.ts
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  type FiatCurrencyType,
  FIAT_CURRENCY_LIST,
  getCurrencySymbol,
  getCurrencyName,
} from './currency';

// ============================================
// COMPANY SETTINGS
// ============================================

export const companySettings = sqliteTable('company_settings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => 'single'),

  // ============================================
  // COMPANY INFORMATION
  // ============================================
  companyName: text('companyName').notNull().default('Boostly'),
  logoUrl: text('logoUrl'),
  logoKey: text('logoKey'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  country: text('country').default('Rwanda'),
  postalCode: text('postalCode'),
  website: text('website'),
  description: text('description'),

  // ============================================
  // TAX & REGISTRATION
  // ============================================
  tin: text('tin'),
  vatNumber: text('vatNumber'),
  registrationNumber: text('registrationNumber'),

  // ============================================
  // BASE CURRENCY & EXCHANGE RATES SETTINGS
  // ============================================
  // The main currency used for all platform transactions and calculations
  baseCurrency: text('baseCurrency').$type<FiatCurrencyType>().default('USD'),
  baseCurrencySymbol: text('baseCurrencySymbol').default('$'),

  // All supported currencies (full list from currency.ts)
  supportedCurrencies: text('supportedCurrencies', { mode: 'json' })
    .$type<FiatCurrencyType[]>()
    .default(FIAT_CURRENCY_LIST),

  // Currency display settings
  currencyPosition: text('currencyPosition').default('before'), // 'before' | 'after'
  decimalPlaces: integer('decimalPlaces').default(2),
  thousandSeparator: text('thousandSeparator').default(','),
  decimalSeparator: text('decimalSeparator').default('.'),

  // ============================================
  // EXCHANGE RATE SETTINGS
  // ============================================
  // Auto-update exchange rates
  autoUpdateRates: integer('autoUpdateRates', { mode: 'boolean' }).default(
    true,
  ),
  rateUpdateInterval: integer('rateUpdateInterval').default(3600),
  lastRateUpdate: text('lastRateUpdate'),

  // Rate source API configuration
  rateProvider: text('rateProvider').default('exchangerate-api'),
  rateApiKey: text('rateApiKey'),
  rateApiUrl: text('rateApiUrl'),

  // Custom rate overrides (JSON) - allows manual rate overrides
  customRates: text('customRates', { mode: 'json' })
    .$type<Record<string, number>>()
    .default({}),

  // ============================================
  // CRYPTO SETTINGS
  // ============================================
  // Enable/disable crypto features
  cryptoEnabled: integer('cryptoEnabled', { mode: 'boolean' }).default(false),
  cryptoAutoUpdateRates: integer('cryptoAutoUpdateRates', {
    mode: 'boolean',
  }).default(true),
  cryptoRateProvider: text('cryptoRateProvider').default('coingecko'),
  cryptoRateApiKey: text('cryptoRateApiKey'),

  // Supported crypto currencies (JSON array)
  supportedCryptoCurrencies: text('supportedCryptoCurrencies', { mode: 'json' })
    .$type<string[]>()
    .default([
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
    ]),

  // ============================================
  // LEGACY CURRENCY FIELDS (for backward compatibility)
  // ============================================
  currency: text('currency').notNull().default('RWF'),
  currencySymbol: text('currencySymbol').notNull().default('RWF'),

  // ============================================
  // LOCALE SETTINGS
  // ============================================
  timezone: text('timezone').default('Africa/Kigali'),
  dateFormat: text('dateFormat').default('MMM DD, YYYY'),
  timeFormat: text('timeFormat').default('HH:mm'),
  weekStartDay: integer('weekStartDay').default(1), // 0=Sunday, 1=Monday

  // ============================================
  // PLATFORM SETTINGS
  // ============================================
  /**
   * Maintenance Mode - When enabled, the platform displays a maintenance page
   * to all users except admins. Useful for updates, migrations, or emergency fixes.
   */
  maintenanceMode: integer('maintenanceMode', { mode: 'boolean' }).default(
    false,
  ),

  /**
   * Registration Open - Controls whether new user registrations are allowed.
   * When disabled, new users cannot create accounts on the platform.
   */
  registrationOpen: integer('registrationOpen', { mode: 'boolean' }).default(
    true,
  ),

  // ============================================
  // SECURITY SETTINGS
  // ============================================
  requireTwoFactorForAdmins: integer('requireTwoFactorForAdmins', {
    mode: 'boolean',
  }).default(false),
  sessionTimeoutMinutes: integer('sessionTimeoutMinutes').default(30),
  failedLoginAttemptsLimit: integer('failedLoginAttemptsLimit').default(5),
  ipWhitelistingEnabled: integer('ipWhitelistingEnabled', {
    mode: 'boolean',
  }).default(false),

  // ============================================
  // EMAIL SETTINGS
  // ============================================
  smtpHost: text('smtpHost'),
  smtpPort: text('smtpPort').default('587'),
  smtpUsername: text('smtpUsername'),
  smtpPassword: text('smtpPassword'),
  fromName: text('fromName'),
  fromEmail: text('fromEmail'),
  encryption: text('encryption').default('TLS'),
  replyTo: text('replyTo'),

  // ============================================
  // NOTIFICATION SETTINGS
  // ============================================
  notifications: text('notifications', { mode: 'json' })
    .$type<{
      email: boolean;
      inApp: boolean;
      sms: boolean;
      lowStock: boolean;
      overduePayment: boolean;
      newSale: boolean;
      dailySummary: boolean;
      weeklyReport: boolean;
      monthlyReport: boolean;
      withdrawalAlerts: boolean;
      cryptoDepositAlerts: boolean;
    }>()
    .default({
      email: true,
      inApp: true,
      sms: false,
      lowStock: true,
      overduePayment: true,
      newSale: true,
      dailySummary: true,
      weeklyReport: true,
      monthlyReport: true,
      withdrawalAlerts: true,
      cryptoDepositAlerts: true,
    }),

  // ============================================
  // FEATURE FLAGS
  // ============================================
  features: text('features', { mode: 'json' })
    .$type<{
      referrals: boolean;
      badges: boolean;
      subscriptions: boolean;
      crypto: boolean;
      ads: boolean;
      games: boolean;
      surveys: boolean;
      videos: boolean;
      leaderboard: boolean;
      dailyBonus: boolean;
    }>()
    .default({
      referrals: true,
      badges: true,
      subscriptions: true,
      crypto: false,
      ads: true,
      games: true,
      surveys: true,
      videos: true,
      leaderboard: true,
      dailyBonus: true,
    }),

  // ============================================
  // TIMESTAMPS
  // ============================================
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updatedAt')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

// ============================================
// TYPES
// ============================================
export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get default company settings with all African currencies
 */
export function getDefaultCompanySettings(): NewCompanySettings {
  return {
    id: 'single',
    companyName: 'Boostly',
    baseCurrency: 'USD',
    baseCurrencySymbol: '$',
    // Use all currencies from currency.ts
    supportedCurrencies: FIAT_CURRENCY_LIST,
    currency: 'RWF',
    currencySymbol: 'RWF',
    currencyPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    timezone: 'Africa/Kigali',
    dateFormat: 'MMM DD, YYYY',
    timeFormat: 'HH:mm',
    weekStartDay: 1,
    autoUpdateRates: true,
    rateUpdateInterval: 3600,
    rateProvider: 'exchangerate-api',
    cryptoEnabled: false,
    cryptoAutoUpdateRates: true,
    cryptoRateProvider: 'coingecko',
    supportedCryptoCurrencies: [
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
    ],
    customRates: {},
    maintenanceMode: false,
    registrationOpen: true,
    requireTwoFactorForAdmins: false,
    sessionTimeoutMinutes: 30,
    failedLoginAttemptsLimit: 5,
    ipWhitelistingEnabled: false,
    notifications: {
      email: true,
      inApp: true,
      sms: false,
      lowStock: true,
      overduePayment: true,
      newSale: true,
      dailySummary: true,
      weeklyReport: true,
      monthlyReport: true,
      withdrawalAlerts: true,
      cryptoDepositAlerts: true,
    },
    features: {
      referrals: true,
      badges: true,
      subscriptions: true,
      crypto: false,
      ads: true,
      games: true,
      surveys: true,
      videos: true,
      leaderboard: true,
      dailyBonus: true,
    },
  };
}

/**
 * Get all supported currencies with their info
 */
export function getAllSupportedCurrencies() {
  return FIAT_CURRENCY_LIST.map((code) => ({
    code,
    symbol: getCurrencySymbol(code),
    name: getCurrencyName(code),
  }));
}

// Re-export currency helpers from currency.ts for convenience
export { getCurrencySymbol, getCurrencyName } from './currency';
