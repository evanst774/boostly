// src/modules/wallet/validation.ts
import { z } from 'zod';

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
export const createWithdrawalSchema = z
  .object({
    amount: z.number().positive().min(1000, 'Minimum withdrawal is Rwf 1,000'),
    method: z.enum(['MOBILE_MONEY', 'BANK_TRANSFER', 'CARD']),
    phoneNumber: z.string().optional(),
    bankAccount: z.string().optional(),
    accountName: z.string().optional(),
    bankName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'MOBILE_MONEY' && !data.phoneNumber) {
        return false;
      }
      if (
        data.method === 'BANK_TRANSFER' &&
        (!data.bankAccount || !data.accountName || !data.bankName)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Missing required fields for selected payment method',
    },
  );

export const processWithdrawalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ProcessWithdrawalInput = z.infer<typeof processWithdrawalSchema>;
