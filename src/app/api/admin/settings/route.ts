// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { companySettings } from '@/lib/db/schema/company';
import {
  FIAT_CURRENCY_LIST,
  type FiatCurrencyType,
} from '@/lib/db/schema/currency';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  // Company Information
  companyName: z.string().optional(),
  logoUrl: z.url().optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  website: z.url().optional(),
  description: z.string().optional(),

  // Tax & Registration
  tin: z.string().optional(),
  vatNumber: z.string().optional(),
  registrationNumber: z.string().optional(),

  // Currency
  baseCurrency: z
    .enum(FIAT_CURRENCY_LIST as [FiatCurrencyType, ...FiatCurrencyType[]])
    .optional(),
  currencySymbol: z.string().optional(),
  currencyPosition: z.enum(['before', 'after']).optional(),
  decimalPlaces: z.number().min(0).max(4).optional(),
  thousandSeparator: z.string().optional(),
  decimalSeparator: z.string().optional(),

  // Locale
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
  weekStartDay: z.number().min(0).max(6).optional(),

  // Email
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  encryption: z.enum(['TLS', 'SSL', 'STARTTLS', 'NONE']).optional(),
  replyTo: z.string().email().optional(),

  // Features
  maintenanceMode: z.boolean().optional(),
  registrationOpen: z.boolean().optional(),

  // Security
  requireTwoFactorForAdmins: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().positive().optional(),
  failedLoginAttemptsLimit: z.number().int().positive().optional(),
  ipWhitelistingEnabled: z.boolean().optional(),
  cryptoEnabled: z.boolean().optional(),

  // Notifications - maps to notifications in schema
  notifications: z
    .object({
      email: z.boolean().optional(),
      inApp: z.boolean().optional(),
      sms: z.boolean().optional(),
      lowStock: z.boolean().optional(),
      overduePayment: z.boolean().optional(),
      newSale: z.boolean().optional(),
      dailySummary: z.boolean().optional(),
      weeklyReport: z.boolean().optional(),
      monthlyReport: z.boolean().optional(),
      withdrawalAlerts: z.boolean().optional(),
      cryptoDepositAlerts: z.boolean().optional(),
    })
    .optional(),

  // Features Flags - maps to features in schema
  features: z
    .object({
      referrals: z.boolean().optional(),
      badges: z.boolean().optional(),
      subscriptions: z.boolean().optional(),
      crypto: z.boolean().optional(),
      ads: z.boolean().optional(),
      games: z.boolean().optional(),
      surveys: z.boolean().optional(),
      videos: z.boolean().optional(),
      leaderboard: z.boolean().optional(),
      dailyBonus: z.boolean().optional(),
    })
    .optional(),
});

// Default settings matching the schema
const defaultSettings = {
  companyName: 'Boostly',
  logoUrl: null,
  logoKey: null,
  phone: null,
  email: null,
  address: null,
  city: null,
  country: 'Rwanda',
  postalCode: null,
  website: 'https://boostly.buzz',
  description:
    'Earn rewards by watching videos, playing games, and completing surveys',
  tin: null,
  vatNumber: null,
  registrationNumber: null,
  baseCurrency: 'RWF' as FiatCurrencyType,
  baseCurrencySymbol: 'FRw',
  supportedCurrencies: FIAT_CURRENCY_LIST,
  currencyPosition: 'before',
  decimalPlaces: 2,
  thousandSeparator: ',',
  decimalSeparator: '.',
  autoUpdateRates: true,
  rateUpdateInterval: 3600,
  lastRateUpdate: null,
  rateProvider: 'exchangerate-api',
  rateApiKey: null,
  rateApiUrl: null,
  customRates: {},
  cryptoEnabled: false,
  cryptoAutoUpdateRates: true,
  cryptoRateProvider: 'coingecko',
  cryptoRateApiKey: null,
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
  currency: 'RWF',
  currencySymbol: 'FRw',
  timezone: 'Africa/Kigali',
  dateFormat: 'MMM DD, YYYY',
  timeFormat: 'HH:mm',
  weekStartDay: 1,
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpUsername: null,
  smtpPassword: null,
  fromName: 'Boostly',
  fromEmail: 'noreply@boostly.buzz',
  encryption: 'TLS',
  replyTo: null,
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
  maintenanceMode: false,
  registrationOpen: true,
  requireTwoFactorForAdmins: false,
  sessionTimeoutMinutes: 30,
  failedLoginAttemptsLimit: 5,
  ipWhitelistingEnabled: false,
};

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.id, 'single'),
    });

    if (!settings) {
      return NextResponse.json({
        ...defaultSettings,
        // Computed fields for frontend
        maintenanceMode: false,
        registrationOpen: true,
      });
    }

    // Map database fields to API response
    return NextResponse.json({
      // Company
      companyName: settings.companyName || defaultSettings.companyName,
      logoUrl: settings.logoUrl || defaultSettings.logoUrl,
      phone: settings.phone || defaultSettings.phone,
      email: settings.email || defaultSettings.email,
      address: settings.address || defaultSettings.address,
      city: settings.city || defaultSettings.city,
      country: settings.country || defaultSettings.country,
      postalCode: settings.postalCode || defaultSettings.postalCode,
      website: settings.website || defaultSettings.website,
      description: settings.description || defaultSettings.description,

      // Tax
      tin: settings.tin || defaultSettings.tin,
      vatNumber: settings.vatNumber || defaultSettings.vatNumber,
      registrationNumber:
        settings.registrationNumber || defaultSettings.registrationNumber,

      // Currency
      baseCurrency: settings.baseCurrency || defaultSettings.baseCurrency,
      currencySymbol: settings.currencySymbol || defaultSettings.currencySymbol,
      currencyPosition:
        settings.currencyPosition || defaultSettings.currencyPosition,
      decimalPlaces: settings.decimalPlaces ?? defaultSettings.decimalPlaces,
      thousandSeparator:
        settings.thousandSeparator || defaultSettings.thousandSeparator,
      decimalSeparator:
        settings.decimalSeparator || defaultSettings.decimalSeparator,

      // Locale
      timezone: settings.timezone || defaultSettings.timezone,
      dateFormat: settings.dateFormat || defaultSettings.dateFormat,
      timeFormat: settings.timeFormat || defaultSettings.timeFormat,
      weekStartDay: settings.weekStartDay ?? defaultSettings.weekStartDay,

      // Email
      smtpHost: settings.smtpHost || defaultSettings.smtpHost,
      smtpPort: settings.smtpPort || defaultSettings.smtpPort,
      smtpUsername: settings.smtpUsername || defaultSettings.smtpUsername,
      smtpPassword: settings.smtpPassword || defaultSettings.smtpPassword,
      fromName: settings.fromName || defaultSettings.fromName,
      fromEmail: settings.fromEmail || defaultSettings.fromEmail,
      encryption: settings.encryption || defaultSettings.encryption,
      replyTo: settings.replyTo || defaultSettings.replyTo,

      // Features (mapped from schema)
      cryptoEnabled: settings.cryptoEnabled ?? defaultSettings.cryptoEnabled,

      // Notifications
      notifications: settings.notifications || defaultSettings.notifications,

      // Features Flags
      features: settings.features || defaultSettings.features,

      // Platform settings — these ARE in the schema (maintenanceMode,
      // registrationOpen columns exist), so read the real values instead of
      // hardcoding false/true. Previously the toggles in SettingsTab saved
      // nothing and always displayed the hardcoded defaults.
      maintenanceMode:
        settings.maintenanceMode ?? defaultSettings.maintenanceMode ?? false,
      registrationOpen:
        settings.registrationOpen ?? defaultSettings.registrationOpen ?? true,

      // Security
      requireTwoFactorForAdmins:
        settings.requireTwoFactorForAdmins ??
        defaultSettings.requireTwoFactorForAdmins ??
        false,
      sessionTimeoutMinutes:
        settings.sessionTimeoutMinutes ??
        defaultSettings.sessionTimeoutMinutes ??
        30,
      failedLoginAttemptsLimit:
        settings.failedLoginAttemptsLimit ??
        defaultSettings.failedLoginAttemptsLimit ??
        5,
      ipWhitelistingEnabled:
        settings.ipWhitelistingEnabled ??
        defaultSettings.ipWhitelistingEnabled ??
        false,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const body = await request.json();
    const validated = settingsSchema.parse(body);

    // Check if settings exist
    const existing = await db.query.companySettings.findFirst({
      where: eq(companySettings.id, 'single'),
    });

    const now = new Date().toISOString();

    // Build update data matching the schema
    const updateData: Record<string, unknown> = {
      // Company
      companyName: validated.companyName,
      logoUrl: validated.logoUrl,
      phone: validated.phone,
      email: validated.email,
      address: validated.address,
      city: validated.city,
      country: validated.country,
      postalCode: validated.postalCode,
      website: validated.website,
      description: validated.description,

      // Tax
      tin: validated.tin,
      vatNumber: validated.vatNumber,
      registrationNumber: validated.registrationNumber,

      // Currency
      baseCurrency: validated.baseCurrency as FiatCurrencyType,
      // FIX: keep the canonical symbol field in sync. Previously only the
      // legacy `currencySymbol` column was written, so `baseCurrencySymbol`
      // stayed at its stale default ('$') forever — which is why switching
      // to UGX updated the code but never the displayed symbol anywhere
      // that read the canonical field.
      baseCurrencySymbol: validated.currencySymbol,
      currencySymbol: validated.currencySymbol, // legacy field, kept for whatever still reads it
      currencyPosition: validated.currencyPosition,
      decimalPlaces: validated.decimalPlaces,
      thousandSeparator: validated.thousandSeparator,
      decimalSeparator: validated.decimalSeparator,

      // Locale
      timezone: validated.timezone,
      dateFormat: validated.dateFormat,
      timeFormat: validated.timeFormat,
      weekStartDay: validated.weekStartDay,

      // Email
      smtpHost: validated.smtpHost,
      smtpPort: validated.smtpPort,
      smtpUsername: validated.smtpUsername,
      smtpPassword: validated.smtpPassword,
      fromName: validated.fromName,
      fromEmail: validated.fromEmail,
      encryption: validated.encryption,
      replyTo: validated.replyTo,

      // Platform settings — these columns exist in the schema, so persist
      // them. Previously the SettingsTab toggles were sent, validated, and
      // then silently dropped on the floor.
      maintenanceMode: validated.maintenanceMode,
      registrationOpen: validated.registrationOpen,

      // Security
      requireTwoFactorForAdmins: validated.requireTwoFactorForAdmins,
      sessionTimeoutMinutes: validated.sessionTimeoutMinutes,
      failedLoginAttemptsLimit: validated.failedLoginAttemptsLimit,
      ipWhitelistingEnabled: validated.ipWhitelistingEnabled,

      // Features
      cryptoEnabled: validated.cryptoEnabled,

      // Notifications
      notifications: validated.notifications,

      // Features Flags
      features: validated.features,

      updatedAt: now,
    };

    // Remove undefined values so partial saves don't null-out other fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (existing) {
      // Update existing settings
      await db
        .update(companySettings)
        .set(updateData)
        .where(eq(companySettings.id, 'single'));
    } else {
      // Insert new settings — id resolves to 'single' via the schema's $defaultFn
      const insertData = {
        ...defaultSettings,
        ...updateData,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(companySettings).values(insertData);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to save settings',
      },
      { status: 500 },
    );
  }
}
