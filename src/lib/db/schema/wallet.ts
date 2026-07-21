// src/lib/db/schema/wallet.ts
import { relations, sql } from 'drizzle-orm';
import { real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { type FiatCurrencyType } from './currency';

// ============================================
// ENUMS
// ============================================
export const TransactionTypeEnum = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
} as const;

export type TransactionType =
  (typeof TransactionTypeEnum)[keyof typeof TransactionTypeEnum];
export const TRANSACTION_TYPE_LIST = Object.values(TransactionTypeEnum);

export const TransactionStatusEnum = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type TransactionStatus =
  (typeof TransactionStatusEnum)[keyof typeof TransactionStatusEnum];
export const TRANSACTION_STATUS_LIST = Object.values(TransactionStatusEnum);

export const PaymentMethodEnum = {
  MOBILE_MONEY: 'MOBILE_MONEY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD: 'CARD',
  CASH: 'CASH',
  CRYPTO: 'CRYPTO',
} as const;

export type PaymentMethod =
  (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum];
export const PAYMENT_METHOD_LIST = Object.values(PaymentMethodEnum);

export const WithdrawalStatusEnum = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type WithdrawalStatus =
  (typeof WithdrawalStatusEnum)[keyof typeof WithdrawalStatusEnum];
export const WITHDRAWAL_STATUS_LIST = Object.values(WithdrawalStatusEnum);

// ============================================
// WALLET TABLE - Multi-currency support
// ============================================
export const wallets = sqliteTable(
  'wallets',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Default currency for this user
    defaultCurrency: text('defaultCurrency')
      .$type<FiatCurrencyType>()
      .notNull()
      .default('RWF'),

    // Balance in default currency
    balance: real('balance').notNull().default(0),
    totalEarned: real('totalEarned').notNull().default(0),
    totalWithdrawn: real('totalWithdrawn').notNull().default(0),
    pendingWithdrawal: real('pendingWithdrawal').notNull().default(0),

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
    index('wallets_user_idx').on(table.userId),
    index('wallets_balance_idx').on(table.balance),
    index('wallets_default_currency_idx').on(table.defaultCurrency),
  ],
);

// ============================================
// CURRENCY EXCHANGE RATES TABLE
// ============================================
export const exchangeRates = sqliteTable(
  'exchange_rates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Base currency (e.g., USD, RWF, etc.)
    baseCurrency: text('baseCurrency')
      .$type<FiatCurrencyType>()
      .notNull()
      .default('USD'),

    // Target currency
    targetCurrency: text('targetCurrency').$type<FiatCurrencyType>().notNull(),

    // Rate: 1 baseCurrency = rate targetCurrency
    rate: real('rate').notNull(),

    // Change percentage (24h)
    change24h: real('change24h').default(0),

    // Volume (24h)
    volume24h: real('volume24h').default(0),

    // Market cap (for crypto)
    marketCap: real('marketCap').default(0),

    // Last updated timestamp
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
  (table) => [
    index('exchange_rates_target_currency_idx').on(table.targetCurrency),
    index('exchange_rates_base_currency_idx').on(table.baseCurrency),
    // Composite unique index to prevent duplicates
    index('exchange_rates_base_target_idx').on(
      table.baseCurrency,
      table.targetCurrency,
    ),
  ],
);

// ============================================
// TRANSACTIONS TABLE - Multi-currency
// ============================================
export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    walletId: text('walletId')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Transaction details
    type: text('type').$type<TransactionType>().notNull(),
    amount: real('amount').notNull(),
    currency: text('currency').$type<FiatCurrencyType>().notNull(),
    amountInBase: real('amountInBase').notNull(), // Amount converted to user's base currency

    description: text('description').notNull(),

    // Reference
    referenceId: text('referenceId'),
    referenceType: text('referenceType'),

    // Status
    status: text('status')
      .$type<TransactionStatus>()
      .notNull()
      .default('PENDING'),

    // Metadata
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),

    // Timestamps
    completedAt: text('completedAt'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('transactions_wallet_idx').on(table.walletId),
    index('transactions_user_idx').on(table.userId),
    index('transactions_type_idx').on(table.type),
    index('transactions_status_idx').on(table.status),
    index('transactions_currency_idx').on(table.currency),
    index('transactions_created_at_idx').on(table.createdAt),
    index('transactions_reference_idx').on(
      table.referenceId,
      table.referenceType,
    ),
  ],
);

// ============================================
// WITHDRAWALS TABLE - Multi-currency
// ============================================
export const withdrawals = sqliteTable(
  'withdrawals',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Withdrawal details
    amount: real('amount').notNull(),
    currency: text('currency').$type<FiatCurrencyType>().notNull(),
    amountInBase: real('amountInBase').notNull(),

    method: text('method').$type<PaymentMethod>().notNull(),

    // Payment details (depending on method)
    phoneNumber: text('phoneNumber'),
    bankAccount: text('bankAccount'),
    accountName: text('accountName'),
    bankName: text('bankName'),

    // Crypto withdrawal details
    cryptoAddress: text('cryptoAddress'),
    cryptoNetwork: text('cryptoNetwork'),
    txHash: text('txHash'),
    memo: text('memo'),

    // Fee details
    fee: real('fee').default(0),
    netAmount: real('netAmount'),

    // Status
    status: text('status')
      .$type<WithdrawalStatus>()
      .notNull()
      .default('PENDING'),

    // Processing
    processedBy: text('processedBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    processedAt: text('processedAt'),

    // Completion
    completedAt: text('completedAt'),
    reference: text('reference'),
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
    index('withdrawals_user_idx').on(table.userId),
    index('withdrawals_status_idx').on(table.status),
    index('withdrawals_method_idx').on(table.method),
    index('withdrawals_currency_idx').on(table.currency),
    index('withdrawals_created_at_idx').on(table.createdAt),
    index('withdrawals_requested_at_idx').on(table.requestedAt),
    index('withdrawals_tx_hash_idx').on(table.txHash),
  ],
);

// ============================================
// TYPES
// ============================================
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  withdrawals: many(withdrawals),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
  processedByUser: one(users, {
    fields: [withdrawals.processedBy],
    references: [users.id],
  }),
}));

// ============================================
// HELPERS
// ============================================

/**
 * Get the withdrawal status label
 */
export function getWithdrawalStatusLabel(status: WithdrawalStatus): string {
  const labels: Record<WithdrawalStatus, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  };
  return labels[status] || status;
}

/**
 * Get the transaction status label
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Get the payment method label
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    MOBILE_MONEY: 'Mobile Money',
    BANK_TRANSFER: 'Bank Transfer',
    CARD: 'Card',
    CASH: 'Cash',
    CRYPTO: 'Crypto',
  };
  return labels[method] || method;
}

/**
 * Get the transaction type label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    CREDIT: 'Credit',
    DEBIT: 'Debit',
  };
  return labels[type] || type;
}
