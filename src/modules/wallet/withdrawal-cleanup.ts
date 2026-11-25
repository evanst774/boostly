// src/modules/wallet/withdrawal-cleanup.ts
//
// SUPER ADMIN ONLY: permanently remove withdrawal records (e.g. test data).
// Each removal reverses exactly what the withdrawal did to the wallet, in one
// atomic batch, deletes its ledger entries, and is audit-logged with the full
// original record:
//   PENDING / PROCESSING  money is still held  -> returned to the balance
//   COMPLETED             counted as withdrawn -> removed from totalWithdrawn;
//                         with refundCompleted the amount also goes back to
//                         the balance (only for payouts that never really
//                         reached the member, e.g. test payouts)
//   FAILED                already refunded     -> wallet unchanged
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transactions, wallets, withdrawals, WithdrawalStatusEnum } from '@/lib/db/schema';
import { createAuditLog } from '@/lib/audit';
import type { BatchItem } from 'drizzle-orm/batch';

export interface CleanupResult {
  removed: number;
  refunded: number;
  skipped: string[];
}

export async function removeWithdrawals(
  ids: string[],
  actorId: string,
  options: { refundCompleted?: boolean; reason?: string } = {},
): Promise<CleanupResult> {
  const unique = [...new Set(ids)].slice(0, 500);
  if (unique.length === 0) return { removed: 0, refunded: 0, skipped: [] };

  const rows = await db.query.withdrawals.findMany({ where: inArray(withdrawals.id, unique) });
  const found = new Set(rows.map((r) => r.id));
  const result: CleanupResult = { removed: 0, refunded: 0, skipped: unique.filter((id) => !found.has(id)) };

  for (const w of rows) {
    const held = w.status === WithdrawalStatusEnum.PENDING || w.status === WithdrawalStatusEnum.PROCESSING;
    const completed = w.status === WithdrawalStatusEnum.COMPLETED;
    const refund = held || (completed && options.refundCompleted === true);

    const walletUpdate = held
      ? db
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${w.amount}`,
            pendingWithdrawal: sql`MAX(0, ${wallets.pendingWithdrawal} - ${w.amount})`,
          })
          .where(eq(wallets.userId, w.userId))
      : completed
        ? db
            .update(wallets)
            .set({
              totalWithdrawn: sql`MAX(0, ${wallets.totalWithdrawn} - ${w.amount})`,
              ...(refund ? { balance: sql`${wallets.balance} + ${w.amount}` } : {}),
            })
            .where(eq(wallets.userId, w.userId))
        : null;

    const ops: [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]] = [
      db
        .delete(transactions)
        .where(and(eq(transactions.referenceId, w.id), eq(transactions.referenceType, 'withdrawal'))),
      db.delete(withdrawals).where(eq(withdrawals.id, w.id)),
    ];
    if (walletUpdate) ops.push(walletUpdate);
    await db.batch(ops);

    result.removed += 1;
    if (refund) result.refunded += w.amount;

    await createAuditLog({
      userId: actorId,
      action: 'WITHDRAWAL_DELETED',
      entityType: 'withdrawal',
      entityId: w.id,
      oldData: w,
      newData: { refundedToBalance: refund ? w.amount : 0, reason: options.reason ?? null },
    }).catch(() => undefined);
  }

  return result;
}
