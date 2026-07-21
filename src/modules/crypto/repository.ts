// src/modules/crypto/repository.ts
import { db } from '@/lib/db';
import {
  cryptoCurrencies,
  cryptoWallets,
  cryptoDeposits,
  cryptoWithdrawals,
  cryptoRates,
  type CryptoCurrency,
  type NewCryptoCurrency,
  type CryptoWallet,
  type NewCryptoWallet,
  type CryptoDeposit,
  type NewCryptoDeposit,
  type CryptoWithdrawal,
  type NewCryptoWithdrawal,
  type CryptoRate,
  type NewCryptoRate,
  type CryptoCurrencyType,
  type CryptoDepositStatus,
  type CryptoWithdrawalStatus,
} from '@/lib/db/schema/crypto';
import { eq, and, sql, desc } from 'drizzle-orm';

// ============================================
// CRYPTO CURRENCIES REPOSITORY
// ============================================
export class CryptoCurrenciesRepository {
  async create(data: NewCryptoCurrency): Promise<CryptoCurrency> {
    const [currency] = await db
      .insert(cryptoCurrencies)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return currency;
  }

  async getById(id: string): Promise<CryptoCurrency | undefined> {
    return await db.query.cryptoCurrencies.findFirst({
      where: eq(cryptoCurrencies.id, id),
    });
  }

  async getBySymbol(
    symbol: CryptoCurrencyType,
  ): Promise<CryptoCurrency | undefined> {
    return await db.query.cryptoCurrencies.findFirst({
      where: eq(cryptoCurrencies.symbol, symbol),
    });
  }

  async getActive(): Promise<CryptoCurrency[]> {
    return await db.query.cryptoCurrencies.findMany({
      where: eq(cryptoCurrencies.isActive, true),
      orderBy: [cryptoCurrencies.symbol],
    });
  }

  async getAll(): Promise<CryptoCurrency[]> {
    return await db.query.cryptoCurrencies.findMany({
      orderBy: [cryptoCurrencies.symbol],
    });
  }

  async update(
    id: string,
    data: Partial<NewCryptoCurrency>,
  ): Promise<CryptoCurrency | undefined> {
    const [updated] = await db
      .update(cryptoCurrencies)
      .set({
        ...data,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoCurrencies.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(cryptoCurrencies).where(eq(cryptoCurrencies.id, id));
  }
}

// ============================================
// CRYPTO WALLETS REPOSITORY
// ============================================
export class CryptoWalletsRepository {
  async create(data: NewCryptoWallet): Promise<CryptoWallet> {
    const [wallet] = await db
      .insert(cryptoWallets)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return wallet;
  }

  async getById(id: string): Promise<CryptoWallet | undefined> {
    return await db.query.cryptoWallets.findFirst({
      where: eq(cryptoWallets.id, id),
      with: {
        user: true,
        deposits: true,
        withdrawals: true,
      },
    });
  }

  async getByUserId(userId: string): Promise<CryptoWallet[]> {
    return await db.query.cryptoWallets.findMany({
      where: eq(cryptoWallets.userId, userId),
      with: {
        user: true,
      },
      orderBy: [desc(cryptoWallets.createdAt)],
    });
  }

  async getByUserAndCurrency(
    userId: string,
    currency: CryptoCurrencyType,
  ): Promise<CryptoWallet | undefined> {
    return await db.query.cryptoWallets.findFirst({
      where: and(
        eq(cryptoWallets.userId, userId),
        eq(cryptoWallets.currency, currency),
      ),
      with: {
        user: true,
      },
    });
  }

  async getDefaultWallet(userId: string): Promise<CryptoWallet | undefined> {
    return await db.query.cryptoWallets.findFirst({
      where: and(
        eq(cryptoWallets.userId, userId),
        eq(cryptoWallets.isDefault, true),
      ),
    });
  }

  async getOrCreate(
    userId: string,
    currency: CryptoCurrencyType,
  ): Promise<CryptoWallet> {
    const existing = await this.getByUserAndCurrency(userId, currency);
    if (existing) return existing;

    // Generate wallet address (simplified for demo)
    const address = `0x${crypto.randomUUID().replace(/-/g, '').substring(0, 40)}`;

    const [wallet] = await db
      .insert(cryptoWallets)
      .values({
        userId,
        currency,
        address,
        isActive: true,
        isDefault: false,
        balance: 0,
        lockedBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
      })
      .returning();

    return wallet;
  }

  async updateBalance(
    id: string,
    amount: number,
    type: 'add' | 'subtract',
  ): Promise<CryptoWallet | undefined> {
    const [updated] = await db
      .update(cryptoWallets)
      .set({
        balance:
          type === 'add'
            ? sql`${cryptoWallets.balance} + ${amount}`
            : sql`${cryptoWallets.balance} - ${amount}`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        lastActivityAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoWallets.id, id))
      .returning();
    return updated;
  }

  async updateLockedBalance(
    id: string,
    amount: number,
    type: 'add' | 'subtract',
  ): Promise<CryptoWallet | undefined> {
    const [updated] = await db
      .update(cryptoWallets)
      .set({
        lockedBalance:
          type === 'add'
            ? sql`${cryptoWallets.lockedBalance} + ${amount}`
            : sql`${cryptoWallets.lockedBalance} - ${amount}`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoWallets.id, id))
      .returning();
    return updated;
  }

  async getTotalBalance(userId: string): Promise<Record<string, number>> {
    const wallets = await this.getByUserId(userId);
    return wallets.reduce(
      (acc, w) => {
        acc[w.currency] = w.balance;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

// ============================================
// CRYPTO DEPOSITS REPOSITORY
// ============================================
export class CryptoDepositsRepository {
  async create(data: NewCryptoDeposit): Promise<CryptoDeposit> {
    const [deposit] = await db
      .insert(cryptoDeposits)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return deposit;
  }

  async getById(id: string): Promise<CryptoDeposit | undefined> {
    return await db.query.cryptoDeposits.findFirst({
      where: eq(cryptoDeposits.id, id),
      with: {
        user: true,
        wallet: true,
        processedByUser: true,
      },
    });
  }

  async getUserDeposits(
    userId: string,
    filters?: {
      status?: CryptoDepositStatus;
      currency?: CryptoCurrencyType;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ deposits: CryptoDeposit[]; total: number }> {
    const conditions = [eq(cryptoDeposits.userId, userId)];
    if (filters?.status)
      conditions.push(eq(cryptoDeposits.status, filters.status));
    if (filters?.currency)
      conditions.push(eq(cryptoDeposits.currency, filters.currency));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const [items, totalResult] = await Promise.all([
      db.query.cryptoDeposits.findMany({
        where: whereClause,
        with: {
          user: true,
          wallet: true,
        },
        limit,
        offset,
        orderBy: [desc(cryptoDeposits.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(cryptoDeposits)
        .where(whereClause),
    ]);

    return {
      deposits: items,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async updateStatus(
    id: string,
    status: CryptoDepositStatus,
    processedBy?: string,
  ): Promise<CryptoDeposit | undefined> {
    const [updated] = await db
      .update(cryptoDeposits)
      .set({
        status,
        processedBy: processedBy || undefined,
        processedAt:
          status === 'PROCESSING' ||
          status === 'COMPLETED' ||
          status === 'FAILED'
            ? sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : undefined,
        completedAt:
          status === 'COMPLETED'
            ? sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : undefined,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoDeposits.id, id))
      .returning();
    return updated;
  }

  async updateConfirmations(
    id: string,
    confirmations: number,
  ): Promise<CryptoDeposit | undefined> {
    const [updated] = await db
      .update(cryptoDeposits)
      .set({
        confirmations,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoDeposits.id, id))
      .returning();
    return updated;
  }

  async getPendingDeposits(): Promise<CryptoDeposit[]> {
    return await db.query.cryptoDeposits.findMany({
      where: eq(cryptoDeposits.status, 'PENDING'),
      with: {
        user: true,
        wallet: true,
      },
      orderBy: [desc(cryptoDeposits.createdAt)],
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
        db.select({ count: sql<number>`count(*)` }).from(cryptoDeposits),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoDeposits)
          .where(eq(cryptoDeposits.status, 'PENDING')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoDeposits)
          .where(eq(cryptoDeposits.status, 'PROCESSING')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoDeposits)
          .where(eq(cryptoDeposits.status, 'COMPLETED')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoDeposits)
          .where(eq(cryptoDeposits.status, 'FAILED')),
        db
          .select({ sum: sql<number>`sum(${cryptoDeposits.amount})` })
          .from(cryptoDeposits)
          .where(eq(cryptoDeposits.status, 'COMPLETED')),
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
// CRYPTO WITHDRAWALS REPOSITORY
// ============================================
export class CryptoWithdrawalsRepository {
  async create(data: NewCryptoWithdrawal): Promise<CryptoWithdrawal> {
    const [withdrawal] = await db
      .insert(cryptoWithdrawals)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return withdrawal;
  }

  async getById(id: string): Promise<CryptoWithdrawal | undefined> {
    return await db.query.cryptoWithdrawals.findFirst({
      where: eq(cryptoWithdrawals.id, id),
      with: {
        user: true,
        wallet: true,
        processedByUser: true,
      },
    });
  }

  async getUserWithdrawals(
    userId: string,
    filters?: {
      status?: CryptoWithdrawalStatus;
      currency?: CryptoCurrencyType;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ withdrawals: CryptoWithdrawal[]; total: number }> {
    const conditions = [eq(cryptoWithdrawals.userId, userId)];
    if (filters?.status)
      conditions.push(eq(cryptoWithdrawals.status, filters.status));
    if (filters?.currency)
      conditions.push(eq(cryptoWithdrawals.currency, filters.currency));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const [items, totalResult] = await Promise.all([
      db.query.cryptoWithdrawals.findMany({
        where: whereClause,
        with: {
          user: true,
          wallet: true,
        },
        limit,
        offset,
        orderBy: [desc(cryptoWithdrawals.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(cryptoWithdrawals)
        .where(whereClause),
    ]);

    return {
      withdrawals: items,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async updateStatus(
    id: string,
    status: CryptoWithdrawalStatus,
    processedBy?: string,
  ): Promise<CryptoWithdrawal | undefined> {
    const [updated] = await db
      .update(cryptoWithdrawals)
      .set({
        status,
        processedBy: processedBy || undefined,
        processedAt:
          status === 'PROCESSING' ||
          status === 'COMPLETED' ||
          status === 'FAILED'
            ? sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : undefined,
        completedAt:
          status === 'COMPLETED'
            ? sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : undefined,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoWithdrawals.id, id))
      .returning();
    return updated;
  }

  async updateTxHash(
    id: string,
    txHash: string,
  ): Promise<CryptoWithdrawal | undefined> {
    const [updated] = await db
      .update(cryptoWithdrawals)
      .set({
        txHash,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoWithdrawals.id, id))
      .returning();
    return updated;
  }

  async updateFailed(
    id: string,
    reason: string,
  ): Promise<CryptoWithdrawal | undefined> {
    const [updated] = await db
      .update(cryptoWithdrawals)
      .set({
        status: 'FAILED',
        failureReason: reason,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoWithdrawals.id, id))
      .returning();
    return updated;
  }

  async getPendingWithdrawals(): Promise<CryptoWithdrawal[]> {
    return await db.query.cryptoWithdrawals.findMany({
      where: eq(cryptoWithdrawals.status, 'PENDING'),
      with: {
        user: true,
        wallet: true,
      },
      orderBy: [desc(cryptoWithdrawals.createdAt)],
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
        db.select({ count: sql<number>`count(*)` }).from(cryptoWithdrawals),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoWithdrawals)
          .where(eq(cryptoWithdrawals.status, 'PENDING')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoWithdrawals)
          .where(eq(cryptoWithdrawals.status, 'PROCESSING')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoWithdrawals)
          .where(eq(cryptoWithdrawals.status, 'COMPLETED')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(cryptoWithdrawals)
          .where(eq(cryptoWithdrawals.status, 'FAILED')),
        db
          .select({ sum: sql<number>`sum(${cryptoWithdrawals.amount})` })
          .from(cryptoWithdrawals)
          .where(eq(cryptoWithdrawals.status, 'COMPLETED')),
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
// CRYPTO RATES REPOSITORY
// ============================================
export class CryptoRatesRepository {
  async create(data: NewCryptoRate): Promise<CryptoRate> {
    const [rate] = await db
      .insert(cryptoRates)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return rate;
  }

  async getByCurrency(
    currency: CryptoCurrencyType,
  ): Promise<CryptoRate | undefined> {
    return await db.query.cryptoRates.findFirst({
      where: eq(cryptoRates.currency, currency),
    });
  }

  async getAll(): Promise<CryptoRate[]> {
    return await db.query.cryptoRates.findMany({
      orderBy: [cryptoRates.currency],
    });
  }

  async update(
    currency: CryptoCurrencyType,
    data: Partial<NewCryptoRate>,
  ): Promise<CryptoRate | undefined> {
    const [updated] = await db
      .update(cryptoRates)
      .set({
        ...data,
        lastUpdated: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(cryptoRates.currency, currency))
      .returning();
    return updated;
  }

  async getRateInUSD(currency: CryptoCurrencyType): Promise<number> {
    const rate = await this.getByCurrency(currency);
    return rate?.usdRate || 0;
  }

  async updateRates(
    rates: Array<{
      currency: CryptoCurrencyType;
      usdRate: number;
      change24h?: number;
      marketCap?: number;
    }>,
  ): Promise<void> {
    for (const rate of rates) {
      await this.update(rate.currency, {
        usdRate: rate.usdRate,
        change24h: rate.change24h || 0,
        marketCap: rate.marketCap || 0,
      });
    }
  }
}

// ============================================
// EXPORT REPOSITORIES
// ============================================
export const cryptoCurrenciesRepository = new CryptoCurrenciesRepository();
export const cryptoWalletsRepository = new CryptoWalletsRepository();
export const cryptoDepositsRepository = new CryptoDepositsRepository();
export const cryptoWithdrawalsRepository = new CryptoWithdrawalsRepository();
export const cryptoRatesRepository = new CryptoRatesRepository();
