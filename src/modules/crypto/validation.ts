// src/modules/crypto/validation.ts
import { z } from 'zod';
import {
  CRYPTO_CURRENCY_LIST,
  CRYPTO_NETWORK_LIST,
  type CryptoCurrencyType,
  type CryptoNetworkType,
} from '@/lib/db/schema/crypto';

// ============================================
// CRYPTO CURRENCY VALIDATION
// ============================================
export const createCurrencySchema = z.object({
  symbol: z.enum(CRYPTO_CURRENCY_LIST as [CryptoCurrencyType, ...CryptoCurrencyType[]]),
  name: z.string().min(1),
  icon: z.string().optional(),
  network: z.enum(
    CRYPTO_NETWORK_LIST as [CryptoNetworkType, ...CryptoNetworkType[]],
  ),
  contractAddress: z.string().optional(),
  decimalPlaces: z.number().int().min(0).max(18).default(8),
  minDeposit: z.number().min(0).default(0),
  maxDeposit: z.number().positive().optional(),
  minWithdrawal: z.number().min(0).default(0),
  maxWithdrawal: z.number().positive().optional(),
  withdrawalFee: z.number().min(0).default(0),
  depositFee: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isDepositEnabled: z.boolean().default(true),
  isWithdrawalEnabled: z.boolean().default(true),
  confirmationsRequired: z.number().int().min(1).default(3),
});

export const updateCurrencySchema = createCurrencySchema.partial();

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;

// ============================================
// DEPOSIT VALIDATION
// ============================================
export const createDepositSchema = z.object({
  currency: z.enum(
    CRYPTO_CURRENCY_LIST as [CryptoCurrencyType, ...CryptoCurrencyType[]],
  ),
  amount: z.number().positive(),
  fromAddress: z.string().optional(),
  txHash: z.string().optional(),
});

export const processDepositSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  txHash: z.string().optional(),
  confirmations: z.number().int().min(0).optional(),
});

export type CreateDepositInput = z.infer<typeof createDepositSchema>;
export type ProcessDepositInput = z.infer<typeof processDepositSchema>;

// ============================================
// WITHDRAWAL VALIDATION
// ============================================
export const createWithdrawalSchema = z.object({
  currency: z.enum(
    CRYPTO_CURRENCY_LIST as [CryptoCurrencyType, ...CryptoCurrencyType[]],
  ),
  amount: z.number().positive(),
  toAddress: z.string().min(10),
  memo: z.string().optional(),
});

export const processWithdrawalSchema = z.object({
  action: z.enum(['approve', 'reject', 'process']),
  reason: z.string().optional(),
  txHash: z.string().optional(),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ProcessWithdrawalInput = z.infer<typeof processWithdrawalSchema>;
