// src/app/api/wallet/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { walletService } from '@/modules/wallet/service';
import {
  TRANSACTION_TYPE_LIST,
  TRANSACTION_STATUS_LIST,
  type TransactionType,
  type TransactionStatus,
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
    const typeParam = searchParams.get('type');
    const type =
      typeParam && TRANSACTION_TYPE_LIST.includes(typeParam as TransactionType)
        ? (typeParam as TransactionType)
        : undefined;
    const statusParam = searchParams.get('status');
    const status =
      statusParam &&
      TRANSACTION_STATUS_LIST.includes(statusParam as TransactionStatus)
        ? (statusParam as TransactionStatus)
        : undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = await walletService.getUserTransactions(user.id, {
      type,
      status,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      transactions: result.transactions,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
