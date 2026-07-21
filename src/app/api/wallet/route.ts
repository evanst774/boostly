// src/app/api/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { unifiedWalletService } from '@/services/unified-wallet.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get unified wallet data
    const [wallet, transactions, stats] = await Promise.all([
      unifiedWalletService.getUnifiedWallet(user.id),
      unifiedWalletService.getCombinedTransactions(user.id, limit, offset),
      unifiedWalletService.getWalletStats(user.id),
    ]);

    return NextResponse.json({
      wallet,
      transactions: transactions.transactions,
      stats,
      pagination: {
        total: transactions.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Wallet GET error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
