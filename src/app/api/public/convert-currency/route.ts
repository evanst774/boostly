// src/app/api/public/convert-currency/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeRateService } from '@/services/exchange-rate.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const amount = parseFloat(searchParams.get('amount') || '25');
    const fromCurrency = searchParams.get('from') || 'USD';
    const toCurrency = searchParams.get('to');

    // Get the system currency if not specified
    let targetCurrency = toCurrency;
    if (!targetCurrency) {
      const baseCurrency = await exchangeRateService.getBaseCurrency();
      targetCurrency = baseCurrency;
    }

    const result = await exchangeRateService.convertCurrency(
      amount,
      fromCurrency,
      targetCurrency
    );

    return NextResponse.json({
      amount: result.amount,
      rate: result.rate,
      fromCurrency,
      toCurrency: targetCurrency,
      originalAmount: amount,
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}