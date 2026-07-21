// src/lib/db/seeds/exchange-rates-seed.ts

import { db } from '@/lib/db';
import { exchangeRates, type ExchangeRate } from '@/lib/db/schema/wallet';
import {
  FIAT_CURRENCY_LIST,
  type FiatCurrencyType,
} from '@/lib/db/schema/currency';
import { exchangeRateService } from '@/services/exchange-rate.service';
import { eq, and } from 'drizzle-orm';

// Helper to safely cast to FiatCurrencyType
function asFiatCurrency(currency: string): FiatCurrencyType {
  if (FIAT_CURRENCY_LIST.includes(currency as FiatCurrencyType)) {
    return currency as FiatCurrencyType;
  }
  // Default to USD if not found
  return 'USD';
}

export async function seedExchangeRates(): Promise<{
  count: number;
  rates: ExchangeRate[];
}> {
  console.log(' 💱 Seeding exchange rates...');

  const ratesList: ExchangeRate[] = [];
  let count = 0;

  try {
    // Get base currency from settings or default to USD
    const baseCurrency = await exchangeRateService
      .getBaseCurrency()
      .catch(() => 'USD' as FiatCurrencyType);

    // Try to fetch live rates (pass baseCurrency as string for the API)
    const rates = await exchangeRateService.fetchLiveRates(baseCurrency);

    // Also fetch crypto rates
    const cryptoRates = await exchangeRateService.fetchCryptoRates();

    // Combine rates
    const allRates = { ...rates, ...cryptoRates };

    // Save to database - only save fiat currencies
    for (const [currency, rate] of Object.entries(allRates)) {
      if (!rate) continue;

      // Use asFiatCurrency to safely cast
      const targetCurrency = asFiatCurrency(currency);

      // Skip if not a supported fiat currency (asFiatCurrency defaults to USD)
      // But if it defaulted to USD, we should skip unless the original was USD
      if (targetCurrency === 'USD' && currency !== 'USD') {
        continue;
      }

      // Check if rate already exists
      const existing = await db.query.exchangeRates.findFirst({
        where: and(
          eq(exchangeRates.baseCurrency, baseCurrency),
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
        ratesList.push(existing);
      } else {
        const [newRate] = await db
          .insert(exchangeRates)
          .values({
            baseCurrency: baseCurrency,
            targetCurrency: targetCurrency,
            rate,
            lastUpdated: new Date().toISOString(),
          })
          .returning();
        ratesList.push(newRate);
        count++;
      }
    }

    console.log(
      `    ✅ Exchange rates seeded with live data (base: ${baseCurrency})`,
    );
    console.log(`    📊 Seeded ${count} currency rates`);
  } catch (error) {
    console.warn('⚠️ Failed to fetch live rates, using fallback rates');
    // Use fallback rates
    await seedFallbackRates(ratesList);
  }

  return { count, rates: ratesList };
}

async function seedFallbackRates(ratesList: ExchangeRate[]): Promise<void> {
  const baseCurrency = 'USD' as FiatCurrencyType;

  // Only fiat currencies - crypto rates should be seeded via cryptoRates table
  const fallbackRates: Record<string, number> = {
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

  let count = 0;

  for (const [currency, rate] of Object.entries(fallbackRates)) {
    // Use asFiatCurrency to safely cast
    const targetCurrency = asFiatCurrency(currency);

    // Skip if not a supported fiat currency
    if (targetCurrency === 'USD' && currency !== 'USD') {
      continue;
    }

    const existing = await db.query.exchangeRates.findFirst({
      where: and(
        eq(exchangeRates.baseCurrency, baseCurrency),
        eq(exchangeRates.targetCurrency, targetCurrency),
      ),
    });

    if (!existing) {
      const [newRate] = await db
        .insert(exchangeRates)
        .values({
          baseCurrency: baseCurrency,
          targetCurrency: targetCurrency,
          rate,
          lastUpdated: new Date().toISOString(),
        })
        .returning();
      ratesList.push(newRate);
      count++;
    }
  }

  console.log(`Fallback exchange rates seeded (${count} currencies)`);
}
