// src/app/api/crypto/currencies/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { cryptoService } from '@/modules/crypto/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currencies = await cryptoService.getActiveCurrencies();

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error('Currencies GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
