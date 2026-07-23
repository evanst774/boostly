// src/app/api/crypto/deposits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { cryptoService } from '@/modules/crypto/service';
import { createDepositSchema } from '@/modules/crypto/validation';
import {
  CRYPTO_DEPOSIT_STATUS_LIST,
  CRYPTO_CURRENCY_LIST,
  type CryptoDepositStatus,
  type CryptoCurrencyType,
} from '@/lib/db/schema/crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const statusParam = searchParams.get('status');
    const status =
      statusParam &&
      CRYPTO_DEPOSIT_STATUS_LIST.includes(statusParam as CryptoDepositStatus)
        ? (statusParam as CryptoDepositStatus)
        : undefined;
    const currencyParam = searchParams.get('currency');
    const currency =
      currencyParam &&
      CRYPTO_CURRENCY_LIST.includes(currencyParam as CryptoCurrencyType)
        ? (currencyParam as CryptoCurrencyType)
        : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await cryptoService.getUserDeposits(userId, {
      status,
      currency,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Deposits GET error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createDepositSchema.parse(body);

    const deposit = await cryptoService.createDeposit(validated);

    return NextResponse.json({ deposit }, { status: 201 });
  } catch (error) {
    console.error('Deposit POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}