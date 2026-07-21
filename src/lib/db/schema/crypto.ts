// src/lib/db/schema/crypto.ts
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
  index,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// ENUMS
// ============================================
export const CryptoCurrencyEnum = {
  BTC: 'BTC',
  ETH: 'ETH',
  USDT: 'USDT',
  USDC: 'USDC',
  SOL: 'SOL',
  XRP: 'XRP',
  ADA: 'ADA',
  DOT: 'DOT',
  AVAX: 'AVAX',
  MATIC: 'MATIC',
} as const;

export type CryptoCurrencyType =
  (typeof CryptoCurrencyEnum)[keyof typeof CryptoCurrencyEnum];
export const CRYPTO_CURRENCY_LIST = Object.values(CryptoCurrencyEnum);

export const CryptoNetworkEnum = {
  BITCOIN: 'BITCOIN',
  ETHEREUM: 'ETHEREUM',
  BSC: 'BSC',
  POLYGON: 'POLYGON',
  SOLANA: 'SOLANA',
  TRON: 'TRON',
  RIPPLE: 'RIPPLE',
  CARDANO: 'CARDANO',
} as const;

export type CryptoNetworkType =
  (typeof CryptoNetworkEnum)[keyof typeof CryptoNetworkEnum];
export const CRYPTO_NETWORK_LIST = Object.values(CryptoNetworkEnum);

export const CryptoDepositStatusEnum = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type CryptoDepositStatus =
  (typeof CryptoDepositStatusEnum)[keyof typeof CryptoDepositStatusEnum];
export const CRYPTO_DEPOSIT_STATUS_LIST = Object.values(
  CryptoDepositStatusEnum,
);

export const CryptoWithdrawalStatusEnum = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type CryptoWithdrawalStatus =
  (typeof CryptoWithdrawalStatusEnum)[keyof typeof CryptoWithdrawalStatusEnum];
export const CRYPTO_WITHDRAWAL_STATUS_LIST = Object.values(
  CryptoWithdrawalStatusEnum,
);

// ============================================
// CRYPTO CURRENCIES TABLE
// ============================================
export const cryptoCurrencies = sqliteTable(
  'crypto_currencies',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    symbol: text('symbol').$type<CryptoCurrencyType>().notNull().unique(),
    name: text('name').notNull(),
    icon: text('icon'),
    network: text('network').$type<CryptoNetworkType>().notNull(),
    contractAddress: text('contractAddress'),
    decimalPlaces: integer('decimalPlaces').notNull().default(8),
    minDeposit: real('minDeposit').notNull().default(0),
    maxDeposit: real('maxDeposit'),
    minWithdrawal: real('minWithdrawal').notNull().default(0),
    maxWithdrawal: real('maxWithdrawal'),
    withdrawalFee: real('withdrawalFee').notNull().default(0),
    depositFee: real('depositFee').notNull().default(0),
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
    isDepositEnabled: integer('isDepositEnabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    isWithdrawalEnabled: integer('isWithdrawalEnabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    confirmationsRequired: integer('confirmationsRequired')
      .notNull()
      .default(3),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('crypto_currencies_symbol_idx').on(table.symbol),
    index('crypto_currencies_network_idx').on(table.network),
    index('crypto_currencies_active_idx').on(table.isActive),
  ],
);

// ============================================
// CRYPTO WALLETS TABLE (per user)
// ============================================
export const cryptoWallets = sqliteTable(
  'crypto_wallets',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // For each crypto currency
    currency: text('currency').$type<CryptoCurrencyType>().notNull(),
    address: text('address').notNull().unique(),
    privateKey: text('privateKey'), // Encrypted
    publicKey: text('publicKey'),

    // Balances
    balance: real('balance').notNull().default(0),
    lockedBalance: real('lockedBalance').notNull().default(0),
    totalDeposited: real('totalDeposited').notNull().default(0),
    totalWithdrawn: real('totalWithdrawn').notNull().default(0),

    // Status
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
    isDefault: integer('isDefault', { mode: 'boolean' })
      .notNull()
      .default(false),

    // Timestamps
    lastActivityAt: text('lastActivityAt'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('crypto_wallets_user_idx').on(table.userId),
    index('crypto_wallets_currency_idx').on(table.currency),
    index('crypto_wallets_address_idx').on(table.address),
    index('crypto_wallets_user_currency_idx').on(table.userId, table.currency),
  ],
);

// ============================================
// CRYPTO DEPOSITS TABLE
// ============================================
export const cryptoDeposits = sqliteTable(
  'crypto_deposits',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    walletId: text('walletId')
      .notNull()
      .references(() => cryptoWallets.id, { onDelete: 'cascade' }),

    currency: text('currency').$type<CryptoCurrencyType>().notNull(),
    amount: real('amount').notNull(),
    usdAmount: real('usdAmount').notNull(),
    fee: real('fee').notNull().default(0),
    netAmount: real('netAmount').notNull(),

    // Transaction details
    txHash: text('txHash'),
    fromAddress: text('fromAddress'),
    toAddress: text('toAddress'),
    confirmations: integer('confirmations').notNull().default(0),
    requiredConfirmations: integer('requiredConfirmations')
      .notNull()
      .default(3),

    // Status
    status: text('status')
      .$type<CryptoDepositStatus>()
      .notNull()
      .default('PENDING'),

    // Processing
    processedBy: text('processedBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    processedAt: text('processedAt'),
    completedAt: text('completedAt'),

    // Metadata
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('crypto_deposits_user_idx').on(table.userId),
    index('crypto_deposits_wallet_idx').on(table.walletId),
    index('crypto_deposits_tx_hash_idx').on(table.txHash),
    index('crypto_deposits_status_idx').on(table.status),
    index('crypto_deposits_created_at_idx').on(table.createdAt),
  ],
);

// ============================================
// CRYPTO WITHDRAWALS TABLE
// ============================================
export const cryptoWithdrawals = sqliteTable(
  'crypto_withdrawals',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    walletId: text('walletId')
      .notNull()
      .references(() => cryptoWallets.id, { onDelete: 'cascade' }),

    currency: text('currency').$type<CryptoCurrencyType>().notNull(),
    amount: real('amount').notNull(),
    usdAmount: real('usdAmount').notNull(),
    fee: real('fee').notNull().default(0),
    netAmount: real('netAmount').notNull(),

    // Destination
    toAddress: text('toAddress').notNull(),
    memo: text('memo'),

    // Transaction details
    txHash: text('txHash'),

    // Status
    status: text('status')
      .$type<CryptoWithdrawalStatus>()
      .notNull()
      .default('PENDING'),

    // Processing
    processedBy: text('processedBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    processedAt: text('processedAt'),
    completedAt: text('completedAt'),
    failureReason: text('failureReason'),

    // Metadata
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),

    // Timestamps
    requestedAt: text('requestedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('crypto_withdrawals_user_idx').on(table.userId),
    index('crypto_withdrawals_wallet_idx').on(table.walletId),
    index('crypto_withdrawals_tx_hash_idx').on(table.txHash),
    index('crypto_withdrawals_status_idx').on(table.status),
    index('crypto_withdrawals_created_at_idx').on(table.createdAt),
  ],
);

// ============================================
// CRYPTO RATES TABLE (for USD conversion)
// ============================================
export const cryptoRates = sqliteTable(
  'crypto_rates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    currency: text('currency').$type<CryptoCurrencyType>().notNull().unique(),
    usdRate: real('usdRate').notNull(),
    eurRate: real('eurRate'),
    rwfRate: real('rwfRate'),
    marketCap: real('marketCap'),
    volume24h: real('volume24h'),
    change24h: real('change24h'),
    lastUpdated: text('lastUpdated')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [index('crypto_rates_currency_idx').on(table.currency)],
);

// ============================================
// TYPES
// ============================================
export type CryptoCurrency = typeof cryptoCurrencies.$inferSelect;
export type NewCryptoCurrency = typeof cryptoCurrencies.$inferInsert;
export type CryptoWallet = typeof cryptoWallets.$inferSelect;
export type NewCryptoWallet = typeof cryptoWallets.$inferInsert;
export type CryptoDeposit = typeof cryptoDeposits.$inferSelect;
export type NewCryptoDeposit = typeof cryptoDeposits.$inferInsert;
export type CryptoWithdrawal = typeof cryptoWithdrawals.$inferSelect;
export type NewCryptoWithdrawal = typeof cryptoWithdrawals.$inferInsert;
export type CryptoRate = typeof cryptoRates.$inferSelect;
export type NewCryptoRate = typeof cryptoRates.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const cryptoWalletsRelations = relations(
  cryptoWallets,
  ({ one, many }) => ({
    user: one(users, {
      fields: [cryptoWallets.userId],
      references: [users.id],
    }),
    deposits: many(cryptoDeposits),
    withdrawals: many(cryptoWithdrawals),
  }),
);

export const cryptoDepositsRelations = relations(cryptoDeposits, ({ one }) => ({
  user: one(users, {
    fields: [cryptoDeposits.userId],
    references: [users.id],
  }),
  wallet: one(cryptoWallets, {
    fields: [cryptoDeposits.walletId],
    references: [cryptoWallets.id],
  }),
  processedByUser: one(users, {
    fields: [cryptoDeposits.processedBy],
    references: [users.id],
  }),
}));

export const cryptoWithdrawalsRelations = relations(
  cryptoWithdrawals,
  ({ one }) => ({
    user: one(users, {
      fields: [cryptoWithdrawals.userId],
      references: [users.id],
    }),
    wallet: one(cryptoWallets, {
      fields: [cryptoWithdrawals.walletId],
      references: [cryptoWallets.id],
    }),
    processedByUser: one(users, {
      fields: [cryptoWithdrawals.processedBy],
      references: [users.id],
    }),
  }),
);
