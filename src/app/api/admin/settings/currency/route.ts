// src/app/api/admin/settings/currency/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { exchangeRateService } from '@/services/exchange-rate.service';
import {
  FIAT_CURRENCY_LIST,
  type FiatCurrencyType,
} from '@/lib/db/schema/currency';
import { z } from 'zod';

const updateCurrencySchema = z.object({
  baseCurrency: z.enum(
    FIAT_CURRENCY_LIST as [FiatCurrencyType, ...FiatCurrencyType[]],
  ),
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('admin.settings');

    const baseCurrency = await exchangeRateService.getBaseCurrency();
    const { rates } = await exchangeRateService.getRates();

    return NextResponse.json({
      baseCurrency,
      rates,
      supportedCurrencies: FIAT_CURRENCY_LIST,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching currency settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency settings' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('admin.settings');

    const body = await req.json();
    const validated = updateCurrencySchema.parse(body);

    // Update base currency
    await exchangeRateService.setBaseCurrency(
      validated.baseCurrency as FiatCurrencyType,
    );

    // Fetch fresh rates with new base currency
    await exchangeRateService.updateRates(
      validated.baseCurrency as FiatCurrencyType,
    );

    // Get updated rates
    const { rates } = await exchangeRateService.getRates(
      validated.baseCurrency as FiatCurrencyType,
    );

    return NextResponse.json({
      success: true,
      baseCurrency: validated.baseCurrency,
      rates,
      message: `Base currency updated to ${validated.baseCurrency}`,
    });
  } catch (error) {
    console.error('Error updating currency settings:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update currency settings',
      },
      { status: 500 },
    );
  }
}

export async function PUT() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('admin.settings');

    // Force refresh exchange rates
    const baseCurrency = await exchangeRateService.getBaseCurrency();
    await exchangeRateService.updateRates(baseCurrency);

    const { rates } = await exchangeRateService.getRates(baseCurrency);

    return NextResponse.json({
      success: true,
      baseCurrency,
      rates,
      lastUpdated: new Date().toISOString(),
      message: 'Exchange rates refreshed successfully',
    });
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to refresh exchange rates' },
      { status: 500 },
    );
  }
}
