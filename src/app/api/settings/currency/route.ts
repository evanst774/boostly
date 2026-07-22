// src/app/api/settings/currency/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companySettings } from '@/lib/db/schema/company';
import { eq } from 'drizzle-orm';
import { getCurrencySymbol, getCurrencyName } from '@/lib/db/schema/currency';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.id, 'single'),
    });

    const baseCurrency = settings?.baseCurrency || 'RWF';
    const storedSymbol = settings?.currencySymbol;
    const computedSymbol = getCurrencySymbol(baseCurrency);
    const currencySymbol =
      storedSymbol && storedSymbol !== 'RWF' ? storedSymbol : computedSymbol;

    const currencyName = getCurrencyName(baseCurrency) || 'Rwandan Franc';
    const decimalPlaces = settings?.decimalPlaces ?? 0;

    return NextResponse.json({
      baseCurrency,
      currencySymbol,
      currencyName,
      decimalPlaces,
    });
  } catch (error) {
    console.error('Error fetching currency settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency settings' },
      { status: 500 },
    );
  }
}