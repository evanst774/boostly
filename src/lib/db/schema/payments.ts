// src/lib/db/schema/payments.ts
//
// Plan purchases paid by mobile money outside the app: the member sends money
// to Boostly's MoMo number, submits the transaction ID + a screenshot, and an
// admin approves it, which activates the plan.
import { relations, sql } from 'drizzle-orm';
import { index, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { subscriptionPlans } from './badges';

export const PlanPaymentStatusEnum = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type PlanPaymentStatus =
  (typeof PlanPaymentStatusEnum)[keyof typeof PlanPaymentStatusEnum];

export const planPayments = sqliteTable(
  'plan_payments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: text('planId')
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: 'restrict' }),
    billingCycle: text('billingCycle').$type<'MONTHLY' | 'YEARLY'>().notNull(),

    /** Price at submission time (RWF), so later price changes don't matter. */
    amount: real('amount').notNull(),
    currency: text('currency').notNull().default('RWF'),

    provider: text('provider').$type<'MTN' | 'AIRTEL'>().notNull(),
    /** Number the member paid FROM, canonical 2507XXXXXXXX. */
    payerPhone: text('payerPhone').notNull(),
    /** Provider transaction ID, uppercased. Unique: one proof, one payment. */
    transactionRef: text('transactionRef').notNull(),
    /** Private R2 object key of the screenshot (never a public URL). */
    proofKey: text('proofKey').notNull(),
    proofContentType: text('proofContentType'),

    status: text('status').$type<PlanPaymentStatus>().notNull().default('PENDING'),
    reviewedBy: text('reviewedBy').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: text('reviewedAt'),
    rejectionReason: text('rejectionReason'),
    /** The subscription this payment activated. */
    subscriptionId: text('subscriptionId'),

    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [
    index('plan_payments_user_idx').on(t.userId),
    index('plan_payments_status_idx').on(t.status),
    index('plan_payments_created_idx').on(t.createdAt),
    uniqueIndex('plan_payments_txref_idx').on(t.provider, t.transactionRef),
  ],
);

export const planPaymentsRelations = relations(planPayments, ({ one }) => ({
  user: one(users, { fields: [planPayments.userId], references: [users.id] }),
  plan: one(subscriptionPlans, {
    fields: [planPayments.planId],
    references: [subscriptionPlans.id],
  }),
}));

export type PlanPayment = typeof planPayments.$inferSelect;
export type NewPlanPayment = typeof planPayments.$inferInsert;
