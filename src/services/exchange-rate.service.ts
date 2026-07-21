// src/services/exchange-rate.service.ts

import { db } from '@/lib/db';
import { exchangeRates, type ExchangeRate } from '@/lib/db/schema/wallet';
import { companySettings } from '@/lib/db/schema/company';
import {
  FIAT_CURRENCY_LIST,
  type FiatCurrencyType,
  getCurrencySymbol,
} from '@/lib/db/schema/currency';
import { and, eq, sql } from 'drizzle-orm';

// Cache for rates to avoid hitting API too often
let ratesCache: {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: FiatCurrencyType;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// CoinGecko API response type
interface CoinGeckoResponse {
  [key: string]: {
    usd: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
  };
}

// ExchangeRate-API response type
interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
  time_last_updated: number;
}

// Helper to check if currency is supported crypto
function isSupportedCrypto(currency: string): boolean {
  return [
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
  ].includes(currency);
}

export class ExchangeRateService {
  /**
   * Get the platform's base currency from company settings
   */
  async getBaseCurrency(): Promise<FiatCurrencyType> {
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.id, 'single'),
    });
    return (settings?.baseCurrency as FiatCurrencyType) || 'USD';
  }

  /**
   * Update the platform's base currency
   */
  async setBaseCurrency(currency: FiatCurrencyType): Promise<void> {
    await db
      .update(companySettings)
      .set({
        baseCurrency: currency,
        baseCurrencySymbol: getCurrencySymbol(currency),
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(companySettings.id, 'single'));

    // Clear cache when base currency changes
    ratesCache = null;
  }

  /**
   * Fetch live exchange rates from external API
   * Supports both fiat and crypto currencies
   */
  async fetchLiveRates(
    baseCurrency: string = 'USD',
  ): Promise<Record<string, number>> {
    try {
      // Use ExchangeRate-API (free tier)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
        { next: { revalidate: 300 } }, // Cache for 5 minutes
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ExchangeRateResponse;
      return data.rates;
    } catch (error) {
      console.warn('Failed to fetch live rates, using fallback:', error);
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Fetch crypto rates from CoinGecko
   */
  async fetchCryptoRates(): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,solana,ripple,cardano,polkadot,avalanche-2,polygon&vs_currencies=usd',
        { next: { revalidate: 300 } },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as CoinGeckoResponse;

      // Map CoinGecko IDs to our currency codes
      const mapping: Record<string, string> = {
        bitcoin: 'BTC',
        ethereum: 'ETH',
        tether: 'USDT',
        'usd-coin': 'USDC',
        solana: 'SOL',
        ripple: 'XRP',
        cardano: 'ADA',
        polkadot: 'DOT',
        'avalanche-2': 'AVAX',
        polygon: 'MATIC',
      };

      const rates: Record<string, number> = {};
      for (const [key, value] of Object.entries(data)) {
        const currency = mapping[key];
        if (currency && value && typeof value === 'object' && 'usd' in value) {
          rates[currency] = value.usd;
        }
      }

      return rates;
    } catch (error) {
      console.warn('Failed to fetch crypto rates:', error);
      return this.getFallbackCryptoRates();
    }
  }

  /**
   * Fallback rates when API is unavailable
   */
  private getFallbackRates(baseCurrency: string): Record<string, number> {
    // Base rates relative to USD
    const usdRates: Record<string, number> = {
      USD: 1,
      RWF: 1470.56,
      CFA: 600,
      GHS: 15.5,
      UGX: 3700,
      KES: 150,
      ZMW: 25.5,
      MWK: 1700,
      TZS: 2500,
      EUR: 0.92,
      GBP: 0.78,
      NGN: 1500,
      ZAR: 18.5,
    };

    if (baseCurrency === 'USD') {
      return usdRates;
    }

    // Convert from USD to base currency
    const baseRate = usdRates[baseCurrency] || 1;
    const rates: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(usdRates)) {
      rates[currency] = rate / baseRate;
    }
    return rates;
  }

  private getFallbackCryptoRates(): Record<string, number> {
    return {
      BTC: 65000,
      ETH: 3500,
      USDT: 1,
      USDC: 1,
      SOL: 150,
      XRP: 0.6,
      ADA: 0.45,
      DOT: 7,
      AVAX: 40,
      MATIC: 0.7,
    };
  }

  /**
   * Update exchange rates in database with live data
   */
  async updateRates(baseCurrency?: FiatCurrencyType): Promise<void> {
    const base = baseCurrency || (await this.getBaseCurrency());

    try {
      // 1. Fetch fiat rates
      const fiatRates = await this.fetchLiveRates(base);

      // 2. Fetch crypto rates (in USD)
      const cryptoRates = await this.fetchCryptoRates();

      // 3. Convert crypto rates to base currency
      const usdToBase = fiatRates[base] || 1;
      const convertedCryptoRates: Record<string, number> = {};
      for (const [currency, usdRate] of Object.entries(cryptoRates)) {
        convertedCryptoRates[currency] = usdRate * usdToBase;
      }

      // 4. Combine all rates
      const allRates = { ...fiatRates, ...convertedCryptoRates };

      // 5. Save to database - only save currencies that are in our list
      for (const [currency, rate] of Object.entries(allRates)) {
        // Skip if currency is not in our supported list
        const isFiat = FIAT_CURRENCY_LIST.includes(
          currency as FiatCurrencyType,
        );
        const isCrypto = isSupportedCrypto(currency);

        if (!isFiat && !isCrypto) {
          continue;
        }

        // Only store fiat currencies in exchangeRates table
        // Crypto rates are handled separately via cryptoRates table
        if (!isFiat) {
          continue;
        }

        // Cast to FiatCurrencyType (we already checked isFiat)
        const targetCurrency = currency as FiatCurrencyType;

        // Use and() with proper type casting
        const existing = await db.query.exchangeRates.findFirst({
          where: and(
            eq(exchangeRates.baseCurrency, base),
            eq(exchangeRates.targetCurrency, targetCurrency),
          ),
        });

        if (existing) {
          await db
            .update(exchangeRates)
            .set({
              rate,
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(exchangeRates.id, existing.id));
        } else {
          await db.insert(exchangeRates).values({
            baseCurrency: base,
            targetCurrency: targetCurrency,
            rate,
            lastUpdated: new Date().toISOString(),
          });
        }
      }

      // Update company settings last rate update time
      await db
        .update(companySettings)
        .set({
          lastRateUpdate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(companySettings.id, 'single'));

      // Clear cache
      ratesCache = null;

      console.log(`✅ Exchange rates updated with base currency: ${base}`);
      console.log(`   📊 Updated fiat currency rates`);
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      throw new Error('Failed to update exchange rates');
    }
  }

  /**
   * Get cached exchange rates
   */
  async getRates(baseCurrency?: FiatCurrencyType): Promise<{
    rates: Record<string, number>;
    baseCurrency: FiatCurrencyType;
    timestamp: number;
  }> {
    const base = baseCurrency || (await this.getBaseCurrency());
    const now = Date.now();

    // Check cache
    if (
      ratesCache &&
      ratesCache.baseCurrency === base &&
      now - ratesCache.timestamp < CACHE_DURATION
    ) {
      return ratesCache;
    }

    // Fetch from database with proper type
    const dbRates = await db.query.exchangeRates.findMany({
      where: eq(exchangeRates.baseCurrency, base),
    });

    const rates: Record<string, number> = {};
    for (const r of dbRates) {
      rates[r.targetCurrency] = r.rate;
    }

    // If no rates in DB, populate with fallback
    if (Object.keys(rates).length === 0) {
      await this.updateRates(base);
      return this.getRates(base);
    }

    ratesCache = {
      rates,
      baseCurrency: base,
      timestamp: now,
    };

    return ratesCache;
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{ amount: number; rate: number }> {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1 };
    }

    const { rates } = await this.getRates();

    // If we have direct rate from -> to
    // Or convert via base currency
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
      throw new Error(
        `Exchange rate not available for ${fromCurrency} to ${toCurrency}`,
      );
    }

    // Convert: amount in fromCurrency -> amount in toCurrency
    const amountInBase = amount / fromRate;
    const convertedAmount = amountInBase * toRate;

    return {
      amount: convertedAmount,
      rate: toRate / fromRate,
    };
  }

  /**
   * Get all available exchange rates
   */
  async getAllRates(baseCurrency?: FiatCurrencyType): Promise<{
    baseCurrency: FiatCurrencyType;
    rates: ExchangeRate[];
    lastUpdated: string | null;
  }> {
    const base = baseCurrency || (await this.getBaseCurrency());

    const rates = await db.query.exchangeRates.findMany({
      where: eq(exchangeRates.baseCurrency, base),
      orderBy: (exchangeRates, { asc }) => [asc(exchangeRates.targetCurrency)],
    });

    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.id, 'single'),
    });

    return {
      baseCurrency: base,
      rates,
      lastUpdated: settings?.lastRateUpdate || null,
    };
  }

  /**
   * Get rate for a specific currency
   */
  async getRate(
    currency: FiatCurrencyType,
    baseCurrency?: FiatCurrencyType,
  ): Promise<number> {
    const base = baseCurrency || (await this.getBaseCurrency());

    const rate = await db.query.exchangeRates.findFirst({
      where: and(
        eq(exchangeRates.baseCurrency, base),
        eq(exchangeRates.targetCurrency, currency),
      ),
    });

    if (!rate) {
      throw new Error(`Exchange rate not available for ${currency}`);
    }

    return rate.rate;
  }

  /**
   * Refresh rates manually (force update)
   */
  async refreshRates(): Promise<void> {
    const base = await this.getBaseCurrency();
    ratesCache = null;
    await this.updateRates(base);
  }
}

export const exchangeRateService = new ExchangeRateService();
