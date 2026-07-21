// src/app/api/wallet/withdrawals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { walletService } from '@/modules/wallet/service';
import { createWithdrawalSchema } from '@/modules/wallet/validation';
import {
  WITHDRAWAL_STATUS_LIST,
  type WithdrawalStatus,
} from '@/lib/db/schema/wallet';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const statusParam = searchParams.get('status');
    const status =
      statusParam &&
      WITHDRAWAL_STATUS_LIST.includes(statusParam as WithdrawalStatus)
        ? (statusParam as WithdrawalStatus)
        : undefined;

    const result = await walletService.getUserWithdrawals(user.id, {
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      withdrawals: result.withdrawals,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Withdrawals GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
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
    const validated = createWithdrawalSchema.parse(body);

    const withdrawal = await walletService.createWithdrawal(validated);

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    console.error('Withdrawal POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
