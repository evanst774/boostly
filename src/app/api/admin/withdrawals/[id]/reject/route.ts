// src/app/api/admin/withdrawals/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import {
  withdrawals,
  WithdrawalStatusEnum,
  wallets,
  transactions,
  TransactionTypeEnum,
  TransactionStatusEnum,
} from '@/lib/db/schema/wallet';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.WITHDRAWALS_REJECT);

    const body = await request.json();
    const reason = (body?.reason ?? '').trim();
    if (!reason) {
      return NextResponse.json(
        { error: 'A rejection reason is required' },
        { status: 400 },
      );
    }

    const withdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, params.id),
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 },
      );
    }

    if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: 'Withdrawal cannot be rejected' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const updated = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(withdrawals)
        .set({
          status: WithdrawalStatusEnum.FAILED,
          processedBy: currentUser.id,
          processedAt: now,
          failureReason: reason,
          updatedAt: now,
        })
        .where(eq(withdrawals.id, params.id))
        .returning();

      // This is the step the old comment deferred to "a service that
      // restores the pending amount" — without it, a rejected withdrawal
      // just erases the user's money instead of returning it.
      const [wallet] = await tx
        .update(wallets)
        .set({
          pendingWithdrawal: sql`MAX(0, ${wallets.pendingWithdrawal} - ${withdrawal.amount})`,
          balance: sql`${wallets.balance} + ${withdrawal.amount}`,
          updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        })
        .where(eq(wallets.userId, withdrawal.userId))
        .returning();

      if (wallet) {
        await tx.insert(transactions).values({
          walletId: wallet.id,
          userId: withdrawal.userId,
          type: TransactionTypeEnum.CREDIT,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          amountInBase: withdrawal.amountInBase,
          description: `Withdrawal rejected — refunded (${reason})`,
          referenceId: withdrawal.id,
          referenceType: 'withdrawal_refund',
          status: TransactionStatusEnum.COMPLETED,
          completedAt: now,
        });
      }

      return result;
    });

    return NextResponse.json({ success: true, withdrawal: updated });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to reject withdrawal' },
      { status: 500 },
    );
  }
}
