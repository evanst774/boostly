// src/modules/referrals/validation.ts
import { z } from 'zod';

export const createReferralSchema = z.object({
  code: z.string().min(4).max(20).toUpperCase(),
});

export const getReferralsFiltersSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED']).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type GetReferralsFilters = z.infer<typeof getReferralsFiltersSchema>;
