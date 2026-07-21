// src/lib/utils/currency.ts

import { FIAT_CURRENCY_INFO } from '@/lib/db/schema/currency';

// ============================================
// BASIC CURRENCY HELPERS
// ============================================

/**
 * Get currency symbol by currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return (
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO]
      ?.symbol || currencyCode
  );
}

/**
 * Get currency name by currency code
 */
export function getCurrencyName(currencyCode: string): string {
  return (
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO]?.name ||
    currencyCode
  );
}

/**
 * Get currency info by currency code
 */
export function getCurrencyInfo(currencyCode: string) {
  return FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO];
}

/**
 * Get currency decimal places
 */
export function getCurrencyDecimalPlaces(currencyCode: string): number {
  return (
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO]
      ?.decimalPlaces ?? 2
  );
}

// ============================================
// STATIC CURRENCY FORMATTERS (with currency code)
// ============================================

/**
 * Format currency with symbol (e.g., $1,000.00)
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'RWF',
  options: { locale?: string; decimalPlaces?: number } = {},
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${currencyCode}`;
  }

  const info =
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO];
  const decimalPlaces = options.decimalPlaces ?? info?.decimalPlaces ?? 2;
  const locale = options.locale || 'en-US';

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  const symbol = info?.symbol || currencyCode;
  return `${symbol}${formatter.format(amount)}`;
}

/**
 * Format currency with code (e.g., RWF 1,000.00)
 */
export function formatCurrencyWithCode(
  amount: number,
  currencyCode: string,
  options: { locale?: string; decimalPlaces?: number } = {},
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currencyCode} 0`;
  }

  const info =
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO];
  const decimalPlaces = options.decimalPlaces ?? info?.decimalPlaces ?? 2;
  const locale = options.locale || 'en-US';

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return `${currencyCode} ${formatter.format(amount)}`;
}

/**
 * Format currency compact (e.g., 1.5M, 2.5K)
 */
export function formatCurrencyCompact(
  amount: number,
  currencyCode: string,
  options: { locale?: string } = {},
): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';

  const locale = options.locale || 'en-US';

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }

  return formatCurrency(amount, currencyCode, { locale });
}

// ============================================
// DYNAMIC SYSTEM CURRENCY (from settings)
// ============================================

// Currency cache
interface CurrencyConfig {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
}

let cachedCurrency: CurrencyConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Fetch system currency from settings
 */
async function fetchSystemCurrency(): Promise<CurrencyConfig> {
  try {
    const response = await fetch('/api/admin/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch currency settings');
    }

    const data = await response.json();
    const currencyInfo =
      FIAT_CURRENCY_INFO[data.baseCurrency as keyof typeof FIAT_CURRENCY_INFO];

    return {
      code: data.baseCurrency || 'RWF',
      symbol: data.currencySymbol || currencyInfo?.symbol || 'FRw',
      position: data.currencyPosition || 'before',
      decimalPlaces: data.decimalPlaces ?? currencyInfo?.decimalPlaces ?? 0,
      thousandSeparator: data.thousandSeparator || ',',
      decimalSeparator: data.decimalSeparator || '.',
    };
  } catch (error) {
    console.error('Failed to fetch currency settings:', error);
    // Return fallback
    return {
      code: 'RWF',
      symbol: 'FRw',
      position: 'before',
      decimalPlaces: 0,
      thousandSeparator: ',',
      decimalSeparator: '.',
    };
  }
}

/**
 * Get system currency with caching
 */
async function getSystemCurrency(): Promise<CurrencyConfig> {
  const now = Date.now();
  if (cachedCurrency && now - cacheTimestamp < CACHE_DURATION) {
    return cachedCurrency;
  }

  cachedCurrency = await fetchSystemCurrency();
  cacheTimestamp = now;
  return cachedCurrency;
}

// Sync cache for synchronous functions
let syncCurrencyCache: CurrencyConfig | null = null;

/**
 * Update the currency cache synchronously
 */
export function updateCurrencyCache(settings: {
  baseCurrency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
}): void {
  const currencyInfo =
    FIAT_CURRENCY_INFO[
      settings.baseCurrency as keyof typeof FIAT_CURRENCY_INFO
    ];

  syncCurrencyCache = {
    code: settings.baseCurrency || 'RWF',
    symbol: settings.currencySymbol || currencyInfo?.symbol || 'FRw',
    position: settings.currencyPosition || 'before',
    decimalPlaces: settings.decimalPlaces ?? currencyInfo?.decimalPlaces ?? 0,
    thousandSeparator: settings.thousandSeparator || ',',
    decimalSeparator: settings.decimalSeparator || '.',
  };

  cachedCurrency = syncCurrencyCache;
  cacheTimestamp = Date.now();
}

/**
 * Initialize currency cache from API
 */
export async function initializeCurrencyCache(): Promise<void> {
  const currency = await fetchSystemCurrency();
  syncCurrencyCache = currency;
  cachedCurrency = currency;
  cacheTimestamp = Date.now();
}

/**
 * Get sync currency (uses cache or fallback)
 */
function getSyncCurrency(): CurrencyConfig {
  return (
    syncCurrencyCache || {
      code: 'RWF',
      symbol: 'FRw',
      position: 'before',
      decimalPlaces: 0,
      thousandSeparator: ',',
      decimalSeparator: '.',
    }
  );
}

// ============================================
// DYNAMIC CURRENCY FORMATTERS (from system settings)
// ============================================

/**
 * Format currency using system settings (synchronous)
 * This is the primary formatter for the application
 */
export function formatSystemCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${getSyncCurrency().code}`;
  }

  const currency = getSyncCurrency();

  const parts = amount.toFixed(currency.decimalPlaces).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';

  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.thousandSeparator,
  );

  let formattedAmount = formattedInteger;
  if (decimalPart) {
    formattedAmount += currency.decimalSeparator + decimalPart;
  }

  if (currency.position === 'before') {
    return `${currency.symbol} ${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.symbol}`;
  }
}

/**
 * Format currency using system settings (asynchronous)
 * Fetches fresh settings each time
 */
export async function formatSystemCurrencyAsync(
  amount: number,
): Promise<string> {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${(await getSystemCurrency()).code}`;
  }

  const currency = await getSystemCurrency();

  const parts = amount.toFixed(currency.decimalPlaces).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';

  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.thousandSeparator,
  );

  let formattedAmount = formattedInteger;
  if (decimalPart) {
    formattedAmount += currency.decimalSeparator + decimalPart;
  }

  if (currency.position === 'before') {
    return `${currency.symbol} ${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.symbol}`;
  }
}

/**
 * Format currency compact using system settings
 */
export function formatSystemCurrencyCompact(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }

  return formatSystemCurrency(amount);
}

// ============================================
// EXPORT DEFAULT
// ============================================

const currencyUtils = {
  // Helpers
  getCurrencySymbol,
  getCurrencyName,
  getCurrencyInfo,
  getCurrencyDecimalPlaces,

  // Static formatters
  formatCurrency,
  formatCurrencyWithCode,
  formatCurrencyCompact,

  // Dynamic formatters
  formatSystemCurrency,
  formatSystemCurrencyAsync,
  formatSystemCurrencyCompact,

  // Cache management
  updateCurrencyCache,
  initializeCurrencyCache,
};

export default currencyUtils;
