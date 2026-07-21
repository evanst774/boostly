// src/app/api/settings/currency/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companySettings } from '@/lib/db/schema/company';
import { eq } from 'drizzle-orm';
import { getCurrencySymbol, getCurrencyName } from '@/lib/db/schema/currency';

// Route handlers with no dynamic-API usage can get statically cached at
// build time — force this dynamic so a currency change is never served
// from a stale build snapshot.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.id, 'single'),
    });

    const baseCurrency = settings?.baseCurrency || 'RWF';

    // `currencySymbol` (legacy-named column) is the field SettingsTab's save
    // path actually populates today — `baseCurrencySymbol` is written
    // nowhere, so trusting it here silently ignores every currency change.
    // Prefer whichever symbol is actually on record for this currency;
    // fall back to computing it fresh if the stored value is missing or
    // stale (e.g. still holds a previous currency's symbol).
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
