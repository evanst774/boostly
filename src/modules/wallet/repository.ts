// src/modules/wallet/repository.ts
import { db } from '@/lib/db';
import {
  wallets,
  type Wallet,
  transactions,
  type Transaction,
  type NewTransaction,
  withdrawals,
  type Withdrawal,
  type NewWithdrawal,
  TransactionStatusEnum,
  WithdrawalStatusEnum,
  TransactionTypeEnum,
  type TransactionStatus,
  type TransactionType,
  type WithdrawalStatus,
} from '@/lib/db/schema';
import { eq, and, between, sql, desc } from 'drizzle-orm';

// ============================================
// WALLET REPOSITORY
// ============================================
export class WalletRepository {
  async create(userId: string): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values({
        id: crypto.randomUUID(),
        userId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingWithdrawal: 0,
      })
      .returning();
    return wallet;
  }

  async getByUserId(userId: string): Promise<Wallet | undefined> {
    return await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });
  }

  async getOrCreate(userId: string): Promise<Wallet> {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;
    return await this.create(userId);
  }

  async updateBalance(
    userId: string,
    amount: number,
  ): Promise<Wallet | undefined> {
    const [updated] = await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount}`,
        totalEarned:
          amount > 0
            ? sql`${wallets.totalEarned} + ${amount}`
            : wallets.totalEarned,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        lastActivityAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(wallets.userId, userId))
      .returning();
    return updated;
  }

  async updatePendingWithdrawal(
    userId: string,
    amount: number,
  ): Promise<Wallet | undefined> {
    const [updated] = await db
      .update(wallets)
      .set({
        pendingWithdrawal: sql`${wallets.pendingWithdrawal} + ${amount}`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(wallets.userId, userId))
      .returning();
    return updated;
  }

  async updateWithdrawn(
    userId: string,
    amount: number,
  ): Promise<Wallet | undefined> {
    const [updated] = await db
      .update(wallets)
      .set({
        totalWithdrawn: sql`${wallets.totalWithdrawn} + ${amount}`,
        pendingWithdrawal: sql`${wallets.pendingWithdrawal} - ${amount}`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(wallets.userId, userId))
      .returning();
    return updated;
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    pendingWithdrawals: number;
  }> {
    const [users, balance, earned, withdrawn, pending] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(wallets),
      db.select({ sum: sql<number>`sum(${wallets.balance})` }).from(wallets),
      db
        .select({ sum: sql<number>`sum(${wallets.totalEarned})` })
        .from(wallets),
      db
        .select({ sum: sql<number>`sum(${wallets.totalWithdrawn})` })
        .from(wallets),
      db
        .select({ sum: sql<number>`sum(${wallets.pendingWithdrawal})` })
        .from(wallets),
    ]);

    return {
      totalUsers: Number(users[0]?.count ?? 0),
      totalBalance: Number(balance[0]?.sum ?? 0),
      totalEarned: Number(earned[0]?.sum ?? 0),
      totalWithdrawn: Number(withdrawn[0]?.sum ?? 0),
      pendingWithdrawals: Number(pending[0]?.sum ?? 0),
    };
  }
}

// ============================================
// TRANSACTIONS REPOSITORY
// ============================================
export class TransactionsRepository {
  async create(data: NewTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return transaction;
  }

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });
  }

  async getUserTransactions(
    userId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const conditions = [eq(transactions.userId, userId)];

    if (filters?.type) conditions.push(eq(transactions.type, filters.type));
    if (filters?.status)
      conditions.push(eq(transactions.status, filters.status));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        between(transactions.createdAt, filters.startDate, filters.endDate),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const [items, totalResult] = await Promise.all([
      db.query.transactions.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(transactions.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(whereClause),
    ]);

    return {
      transactions: items,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({
        status,
        completedAt:
          status === TransactionStatusEnum.COMPLETED
            ? sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : undefined,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getRecentTransactions(
    userId: string,
    limit: number = 10,
  ): Promise<Transaction[]> {
    return await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      limit,
      orderBy: [desc(transactions.createdAt)],
    });
  }

  async getBalance(userId: string): Promise<number> {
    const result = await db
      .select({
        balance: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.status, TransactionStatusEnum.COMPLETED),
        ),
      );
    return Number(result[0]?.balance ?? 0);
  }

  async getTotalCredits(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, TransactionTypeEnum.CREDIT),
          eq(transactions.status, TransactionStatusEnum.COMPLETED),
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getTotalDebits(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, TransactionTypeEnum.DEBIT),
          eq(transactions.status, TransactionStatusEnum.COMPLETED),
        ),
      );
    return Number(result[0]?.total ?? 0);
  }
}

// ============================================
// WITHDRAWALS REPOSITORY
// ============================================
export class WithdrawalsRepository {
  async create(data: NewWithdrawal): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return withdrawal;
  }

  async getById(id: string): Promise<Withdrawal | undefined> {
    return await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, id),
    });
  }

  async getUserWithdrawals(
    userId: string,
    filters?: {
      status?: WithdrawalStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ withdrawals: Withdrawal[]; total: number }> {
    const conditions = [eq(withdrawals.userId, userId)];

    if (filters?.status)
      conditions.push(eq(withdrawals.status, filters.status));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        between(withdrawals.createdAt, filters.startDate, filters.endDate),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const [items, totalResult] = await Promise.all([
      db.query.withdrawals.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(withdrawals.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(whereClause),
    ]);

    return {
      withdrawals: items,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async updateStatus(
    id: string,
    status: WithdrawalStatus,
    processedBy?: string,
  ): Promise<Withdrawal | undefined> {
    const [updated] = await db
      .update(withdrawals)
      .set({
        status,
        processedBy: processedBy || undefined,
        processedAt:
          status === WithdrawalStatusEnum.PROCESSING
            ? sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : undefined,
        completedAt:
          status === WithdrawalStatusEnum.COMPLETED
            ? sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : undefined,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(withdrawals.id, id))
      .returning();
    return updated;
  }

  async updateFailed(
    id: string,
    reason: string,
  ): Promise<Withdrawal | undefined> {
    const [updated] = await db
      .update(withdrawals)
      .set({
        status: WithdrawalStatusEnum.FAILED,
        failureReason: reason,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(withdrawals.id, id))
      .returning();
    return updated;
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return await db.query.withdrawals.findMany({
      where: eq(withdrawals.status, WithdrawalStatusEnum.PENDING),
      with: { user: true },
      orderBy: [desc(withdrawals.requestedAt)],
    });
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalAmount: number;
  }> {
    const [total, pending, processing, completed, failed, amount] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(withdrawals),
        db
          .select({ count: sql<number>`count(*)` })
          .from(withdrawals)
          .where(eq(withdrawals.status, WithdrawalStatusEnum.PENDING)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(withdrawals)
          .where(eq(withdrawals.status, WithdrawalStatusEnum.PROCESSING)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(withdrawals)
          .where(eq(withdrawals.status, WithdrawalStatusEnum.COMPLETED)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(withdrawals)
          .where(eq(withdrawals.status, WithdrawalStatusEnum.FAILED)),
        db
          .select({ sum: sql<number>`sum(${withdrawals.amount})` })
          .from(withdrawals)
          .where(eq(withdrawals.status, WithdrawalStatusEnum.COMPLETED)),
      ]);

    return {
      total: Number(total[0]?.count ?? 0),
      pending: Number(pending[0]?.count ?? 0),
      processing: Number(processing[0]?.count ?? 0),
      completed: Number(completed[0]?.count ?? 0),
      failed: Number(failed[0]?.count ?? 0),
      totalAmount: Number(amount[0]?.sum ?? 0),
    };
  }
}

// ============================================
// EXPORT REPOSITORIES
// ============================================
export const walletRepository = new WalletRepository();
export const transactionsRepository = new TransactionsRepository();
export const withdrawalsRepository = new WithdrawalsRepository();
