// src/modules/wallet/validation.ts
import { z } from 'zod';
import { MIN_WITHDRAWAL, normalizeRwandaPhone } from '@/lib/constants/payouts';

// ============================================
// TRANSACTION VALIDATION
// ============================================
export const createTransactionSchema = z.object({
  userId: z.uuid(),
  walletId: z.uuid().optional(),
  type: z.enum(['CREDIT', 'DEBIT'] as const),
  amount: z.number().positive(),
  currency: z.string().default('RWF'),
  amountInBase: z.number().positive(),
  description: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  status: z
    .enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    .default('PENDING'),
  completedAt: z.iso.datetime().optional(),
});

export const getTransactionsFiltersSchema = z.object({
  type: z.enum(['CREDIT', 'DEBIT'] as const).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type GetTransactionsFilters = z.infer<
  typeof getTransactionsFiltersSchema
>;

// ============================================
// WITHDRAWAL VALIDATION
// ============================================
// Withdrawals are paid manually to mobile money at the daily 3:00 PM run.
export const createWithdrawalSchema = z.object({
  amount: z
    .number({ message: 'Enter an amount' })
    .int('Enter a whole amount in RWF')
    .min(MIN_WITHDRAWAL, `Minimum withdrawal is ${MIN_WITHDRAWAL.toLocaleString()} RWF`),
  method: z.literal('MOBILE_MONEY').default('MOBILE_MONEY'),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => normalizeRwandaPhone(v) !== null, {
      message: 'Enter a valid MTN or Airtel Rwanda number (e.g. 078 123 4567)',
    }),
  accountName: z
    .string()
    .trim()
    .min(2, 'Enter the name registered on the mobile money account')
    .max(100),
});

export const processWithdrawalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ProcessWithdrawalInput = z.infer<typeof processWithdrawalSchema>;
