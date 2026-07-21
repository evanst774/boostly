// src/lib/db/seeds/wallet/wallet.seed.ts
import { db } from '@/lib/db';
import {
  wallets,
  transactions,
  withdrawals,
  type Wallet,
  type Transaction,
  type Withdrawal,
} from '@/lib/db/schema/wallet';
import { eq } from 'drizzle-orm';
import type { SeedWalletResult } from '../types';

export async function seedWallet(): Promise<SeedWalletResult> {
  console.log('  💰 Seeding wallet data...');

  const walletList: Wallet[] = [];
  const transactionList: Transaction[] = [];
  const withdrawalList: Withdrawal[] = [];

  const userList = await db.query.users.findMany({ limit: 10 });

  for (const user of userList) {
    let wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, user.id),
    });

    if (!wallet) {
      [wallet] = await db
        .insert(wallets)
        .values({
          userId: user.id,
          balance: Math.floor(Math.random() * 100000),
          totalEarned: Math.floor(Math.random() * 200000),
          totalWithdrawn: Math.floor(Math.random() * 50000),
          pendingWithdrawal: Math.floor(Math.random() * 10000),
          defaultCurrency: 'RWF',
        })
        .returning();
      walletList.push(wallet);
      console.log(`    ✅ Wallet for ${user.name}`);
    } else {
      walletList.push(wallet);
    }

    // Create transactions
    if (wallet) {
      const descriptions = [
        'Video Reward',
        'Game Reward',
        'Daily Bonus',
        'Referral Bonus',
        'Withdrawal',
      ];
      for (let i = 0; i < 5; i++) {
        const amount = Math.floor(Math.random() * 500) + 50;
        const [tx] = await db
          .insert(transactions)
          .values({
            walletId: wallet.id,
            userId: user.id,
            type: i % 2 === 0 ? 'CREDIT' : 'DEBIT',
            amount,
            currency: 'RWF',
            amountInBase: amount,
            description: descriptions[i % descriptions.length],
            status: i % 3 === 0 ? 'PENDING' : 'COMPLETED',
            completedAt: i % 3 === 0 ? undefined : new Date().toISOString(),
          })
          .returning();
        transactionList.push(tx);
      }
    }
  }

  return {
    wallets: walletList,
    transactions: transactionList,
    withdrawals: withdrawalList,
  };
}
