// src/app/api/admin/settings/currency/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { exchangeRateService } from '@/services/exchange-rate.service';
import {
  FIAT_CURRENCY_LIST,
  type FiatCurrencyType,
} from '@/lib/db/schema/currency';

export const dynamic = 'force-dynamic';

const schema = z.object({
  currency: z.enum(FIAT_CURRENCY_LIST as [FiatCurrencyType, ...FiatCurrencyType[]]),
  rate: z.number().positive().finite(),
});

/** Manually override one exchange rate (against the current base currency). */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('admin.settings');

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid currency or rate' }, { status: 400 });
    }

    await exchangeRateService.setManualRate(parsed.data.currency, parsed.data.rate);
    const { rates, baseCurrency } = await exchangeRateService.getRates();

    return NextResponse.json({ success: true, baseCurrency, rates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update rate';
    const status = /forbidden/i.test(message) ? 403 : 500;
    if (status === 500) console.error('Manual rate update error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
