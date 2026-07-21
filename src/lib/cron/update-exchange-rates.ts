// src/lib/cron/update-exchange-rates.ts

import { exchangeRateService } from '@/services/exchange-rate.service';

/**
 * This function should be called by a cron job every hour
 * or via a scheduler like Vercel Cron Jobs
 */
export async function updateExchangeRatesJob() {
  console.log('🔄 Running exchange rate update job...');

  try {
    const baseCurrency = await exchangeRateService.getBaseCurrency();
    await exchangeRateService.updateRates(baseCurrency);
    console.log(
      `✅ Exchange rates updated successfully at ${new Date().toISOString()}`,
    );
  } catch (error) {
    console.error('❌ Failed to update exchange rates:', error);
  }
}

// For Vercel Cron Jobs or similar scheduler
export async function GET() {
  await updateExchangeRatesJob();
  return new Response('OK', { status: 200 });
}
