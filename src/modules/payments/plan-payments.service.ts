// src/modules/payments/plan-payments.service.ts
//
// Buying a plan with mobile money:
//   1. member sends the plan price to Boostly's MoMo number (outside the app)
//   2. member submits payer phone + transaction ID + screenshot  -> PENDING
//   3. admin checks the MoMo statement and approves -> plan activates
//      (or rejects with a reason the member sees)
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  companySettings,
  planPayments,
  PlanPaymentStatusEnum,
  subscriptionPlans,
  type PlanPayment,
} from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission, hasPermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { createAuditLog } from '@/lib/audit';
import { notificationsService } from '@/lib/notifications';
import { activateSubscription } from '@/modules/badges/service';
import {
  emailPlanActivated,
  emailPlanPaymentRejected,
  emailPlanPaymentSubmitted,
  inBackground,
} from '@/lib/mail/money-emails';
import {
  detectMobileProvider,
  normalizeRwandaPhone,
  type MobileMoneyProvider,
} from '@/lib/constants/payouts';
import { r2, BUCKET, isR2Configured } from '@/utils/r2/config';
import { uploadToR2 } from '@/utils/r2/upload';

/** A user-facing problem (maps to an HTTP status in the routes). */
export class PlanPaymentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Drop the private storage key before anything leaves the server. */
function withoutProofKey<T extends { proofKey: string }>(row: T): Omit<T, 'proofKey'> {
  const copy: Partial<T> = { ...row };
  delete copy.proofKey;
  return copy as Omit<T, 'proofKey'>;
}

const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

// ─── Settings ─────────────────────────────────────────────────────

export interface MomoDetails {
  mtnNumber: string | null;
  airtelNumber: string | null;
  accountName: string | null;
  configured: boolean;
}

export async function getMomoDetails(): Promise<MomoDetails> {
  const s = await db.query.companySettings.findFirst({
    where: eq(companySettings.id, 'single'),
    columns: { momoMtnNumber: true, momoAirtelNumber: true, momoAccountName: true },
  });
  const mtnNumber = s?.momoMtnNumber || null;
  const airtelNumber = s?.momoAirtelNumber || null;
  const accountName = s?.momoAccountName || null;
  return {
    mtnNumber,
    airtelNumber,
    accountName,
    configured: !!accountName && !!(mtnNumber || airtelNumber),
  };
}

export async function updateMomoDetails(input: {
  mtnNumber?: string | null;
  airtelNumber?: string | null;
  accountName?: string | null;
}) {
  await requirePermission(PermissionKeys.ADMIN_SETTINGS);
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const clean = (v: string | null | undefined, provider: MobileMoneyProvider) => {
    if (!v || !v.trim()) return null;
    const n = normalizeRwandaPhone(v);
    if (!n || detectMobileProvider(n) !== provider) {
      throw new PlanPaymentError(
        400,
        provider === 'MTN'
          ? 'Enter a valid MTN number (078/079)'
          : 'Enter a valid Airtel number (072/073)',
      );
    }
    return n;
  };

  const values = {
    momoMtnNumber: clean(input.mtnNumber, 'MTN'),
    momoAirtelNumber: clean(input.airtelNumber, 'AIRTEL'),
    momoAccountName: input.accountName?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  if (!values.momoAccountName) {
    throw new PlanPaymentError(400, 'Enter the name registered on the MoMo account');
  }
  if (!values.momoMtnNumber && !values.momoAirtelNumber) {
    throw new PlanPaymentError(400, 'Enter at least one MoMo number');
  }

  const updated = await db
    .update(companySettings)
    .set(values)
    .where(eq(companySettings.id, 'single'))
    .returning({ id: companySettings.id });
  if (updated.length === 0) {
    await db.insert(companySettings).values({ id: 'single', ...values });
  }

  await createAuditLog({
    userId: user.id,
    action: 'PAYMENT_SETTINGS_UPDATED',
    entityType: 'company_settings',
    entityId: 'single',
    newData: values,
  });
  return getMomoDetails();
}

// ─── Member side ──────────────────────────────────────────────────

export async function submitPlanPayment(input: {
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  payerPhone: string;
  transactionRef: string;
  proof: File;
}): Promise<PlanPayment> {
  const user = await getCurrentUser();
  if (!user) throw new PlanPaymentError(401, 'Please log in again.');

  const momo = await getMomoDetails();
  if (!momo.configured) {
    throw new PlanPaymentError(503, 'Mobile money payments are not available yet. Please try again later.');
  }

  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, input.planId),
  });
  if (!plan || !plan.isActive || plan.tier === 'FREE') {
    throw new PlanPaymentError(404, 'This plan is not available.');
  }
  const amount = input.billingCycle === 'YEARLY' ? plan.priceYearly ?? 0 : plan.priceMonthly ?? 0;
  if (amount <= 0) throw new PlanPaymentError(400, 'This plan has no price set.');

  const payerPhone = normalizeRwandaPhone(input.payerPhone);
  const provider = payerPhone ? detectMobileProvider(payerPhone) : null;
  if (!payerPhone || !provider) {
    throw new PlanPaymentError(400, 'Enter the MTN or Airtel number you paid from.');
  }
  if (provider === 'MTN' && !momo.mtnNumber) {
    throw new PlanPaymentError(400, 'Please pay with Airtel Money for now.');
  }
  if (provider === 'AIRTEL' && !momo.airtelNumber) {
    throw new PlanPaymentError(400, 'Please pay with MTN MoMo for now.');
  }

  const transactionRef = input.transactionRef.trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9.\-]{6,40}$/.test(transactionRef)) {
    throw new PlanPaymentError(400, 'Enter the transaction ID from your MoMo confirmation SMS.');
  }

  if (!PROOF_TYPES.includes(input.proof.type)) {
    throw new PlanPaymentError(400, 'Upload a screenshot (JPG, PNG, WebP) or a PDF.');
  }
  if (input.proof.size > PROOF_MAX_BYTES) {
    throw new PlanPaymentError(400, 'The screenshot must be smaller than 5 MB.');
  }

  // One open request at a time keeps the review queue clean.
  const open = await db.query.planPayments.findFirst({
    where: and(eq(planPayments.userId, user.id), eq(planPayments.status, PlanPaymentStatusEnum.PENDING)),
    columns: { id: true },
  });
  if (open) {
    throw new PlanPaymentError(409, 'You already have a payment waiting for review.');
  }

  const dup = await db.query.planPayments.findFirst({
    where: and(eq(planPayments.provider, provider), eq(planPayments.transactionRef, transactionRef)),
    columns: { id: true },
  });
  if (dup) {
    throw new PlanPaymentError(409, 'This transaction ID has already been submitted.');
  }

  if (!isR2Configured()) {
    throw new PlanPaymentError(503, 'Uploads are not available right now. Please try again later.');
  }
  const upload = await uploadToR2({
    folder: `payment-proofs/${user.id}`,
    originalName: input.proof.name || 'proof',
    buffer: Buffer.from(await input.proof.arrayBuffer()),
    contentType: input.proof.type,
    userId: user.id,
  });
  if (!upload.success || !upload.key) {
    throw new PlanPaymentError(502, 'Could not upload your screenshot. Please try again.');
  }

  let payment: PlanPayment;
  try {
    [payment] = await db
      .insert(planPayments)
      .values({
        userId: user.id,
        planId: plan.id,
        billingCycle: input.billingCycle,
        amount,
        provider,
        payerPhone,
        transactionRef,
        proofKey: upload.key,
        proofContentType: input.proof.type,
      })
      .returning();
  } catch {
    // Unique (provider, transactionRef) race.
    throw new PlanPaymentError(409, 'This transaction ID has already been submitted.');
  }

  await createAuditLog({
    userId: user.id,
    action: 'PLAN_PAYMENT_SUBMITTED',
    entityType: 'plan_payment',
    entityId: payment.id,
    newData: { planId: plan.id, amount, provider, transactionRef },
  });

  inBackground(
    emailPlanPaymentSubmitted({
      userId: user.id,
      planName: plan.name,
      amount,
      transactionRef,
      payerPhone,
    }),
  );

  await notificationsService
    .createNotificationForUser(
      user.id,
      'Payment received',
      `We're checking your ${plan.name} payment of ${amount.toLocaleString()} RWF. Your plan activates as soon as it's confirmed.`,
      { type: 'INFO', link: '/plans', linkText: 'View plans', entityType: 'plan_payment' },
    )
    .catch(() => {});

  return payment;
}

export async function getMyPlanPayments(limit = 10) {
  const user = await getCurrentUser();
  if (!user) throw new PlanPaymentError(401, 'Please log in again.');
  const rows = await db.query.planPayments.findMany({
    where: eq(planPayments.userId, user.id),
    orderBy: [desc(planPayments.createdAt)],
    limit,
    with: { plan: { columns: { name: true, tier: true } } },
  });
  // Never expose the storage key.
  return rows.map(withoutProofKey);
}

// ─── Admin side ───────────────────────────────────────────────────

export async function listPlanPayments(status: string = 'PENDING', limit = 100) {
  await requirePermission(PermissionKeys.SUBSCRIPTIONS_MANAGE);
  const where =
    status === 'all'
      ? undefined
      : eq(planPayments.status, status as PlanPayment['status']);
  const [rows, counts] = await Promise.all([
    db.query.planPayments.findMany({
      where,
      orderBy: [status === 'PENDING' ? planPayments.createdAt : desc(planPayments.createdAt)],
      limit: Math.min(limit, 500),
      with: {
        plan: { columns: { name: true, tier: true } },
        user: { columns: { id: true, name: true, email: true, phone: true } },
      },
    }),
    db
      .select({ status: planPayments.status, n: sql<number>`count(*)` })
      .from(planPayments)
      .groupBy(planPayments.status),
  ]);
  return {
    payments: rows.map(withoutProofKey),
    counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.n)])),
  };
}

export async function approvePlanPayment(id: string) {
  await requirePermission(PermissionKeys.SUBSCRIPTIONS_MANAGE);
  const admin = await getCurrentUser();
  if (!admin) throw new Error('Unauthorized');

  const now = new Date().toISOString();
  // Claim the row atomically so a double click can't activate twice.
  const [claimed] = await db
    .update(planPayments)
    .set({ status: PlanPaymentStatusEnum.APPROVED, reviewedBy: admin.id, reviewedAt: now, updatedAt: now })
    .where(and(eq(planPayments.id, id), eq(planPayments.status, PlanPaymentStatusEnum.PENDING)))
    .returning();
  if (!claimed) throw new PlanPaymentError(409, 'This payment was already reviewed.');

  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, claimed.planId),
  });
  if (!plan) {
    await db
      .update(planPayments)
      .set({ status: PlanPaymentStatusEnum.PENDING, reviewedBy: null, reviewedAt: null })
      .where(eq(planPayments.id, id));
    throw new PlanPaymentError(404, 'The plan for this payment no longer exists.');
  }

  try {
    const subscription = await activateSubscription({
      userId: claimed.userId,
      plan,
      billingCycle: claimed.billingCycle,
      amountPaid: claimed.amount,
      source: 'MOBILE_MONEY',
      actorId: admin.id,
      paymentId: claimed.id,
    });
    await db
      .update(planPayments)
      .set({ subscriptionId: subscription.id })
      .where(eq(planPayments.id, id));

    inBackground(
      emailPlanActivated({
        userId: claimed.userId,
        planName: plan.name,
        expiresAt: subscription.expiresAt,
      }),
    );

    await createAuditLog({
      userId: admin.id,
      action: 'PLAN_PAYMENT_APPROVED',
      entityType: 'plan_payment',
      entityId: id,
      newData: { memberId: claimed.userId, planId: plan.id, amount: claimed.amount },
    });
    return { ...claimed, subscriptionId: subscription.id };
  } catch (err) {
    // Activation failed: put it back in the queue rather than losing it.
    await db
      .update(planPayments)
      .set({ status: PlanPaymentStatusEnum.PENDING, reviewedBy: null, reviewedAt: null })
      .where(eq(planPayments.id, id));
    throw err;
  }
}

export async function rejectPlanPayment(id: string, reason: string) {
  await requirePermission(PermissionKeys.SUBSCRIPTIONS_MANAGE);
  const admin = await getCurrentUser();
  if (!admin) throw new Error('Unauthorized');
  const why = reason.trim();
  if (why.length < 3) throw new PlanPaymentError(400, 'Give the member a short reason.');

  const now = new Date().toISOString();
  const [row] = await db
    .update(planPayments)
    .set({
      status: PlanPaymentStatusEnum.REJECTED,
      reviewedBy: admin.id,
      reviewedAt: now,
      rejectionReason: why,
      updatedAt: now,
    })
    .where(and(eq(planPayments.id, id), eq(planPayments.status, PlanPaymentStatusEnum.PENDING)))
    .returning();
  if (!row) throw new PlanPaymentError(409, 'This payment was already reviewed.');

  await createAuditLog({
    userId: admin.id,
    action: 'PLAN_PAYMENT_REJECTED',
    entityType: 'plan_payment',
    entityId: id,
    newData: { memberId: row.userId, reason: why },
  });
  const rejectedPlan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, row.planId),
    columns: { name: true },
  });
  inBackground(
    emailPlanPaymentRejected({
      userId: row.userId,
      planName: rejectedPlan?.name ?? 'plan',
      transactionRef: row.transactionRef,
      reason: why,
    }),
  );

  await notificationsService
    .createNotificationForUser(
      row.userId,
      'Payment not confirmed',
      `We couldn't confirm your payment (${row.transactionRef}): ${why}`,
      { type: 'WARNING', link: '/plans', linkText: 'Try again', entityType: 'plan_payment' },
    )
    .catch(() => {});
  return row;
}

/** Streams a proof file to its owner or to a reviewer. Never a public URL. */
export async function getPlanPaymentProof(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new PlanPaymentError(401, 'Unauthorized');
  const row = await db.query.planPayments.findFirst({ where: eq(planPayments.id, id) });
  if (!row) throw new PlanPaymentError(404, 'Not found');
  const allowed =
    row.userId === user.id || (await hasPermission(user.id, PermissionKeys.SUBSCRIPTIONS_MANAGE));
  if (!allowed) throw new PlanPaymentError(404, 'Not found');

  const obj = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: row.proofKey }));
  const bytes = await obj.Body?.transformToByteArray();
  if (!bytes) throw new PlanPaymentError(404, 'Proof file is missing');
  return { bytes, contentType: row.proofContentType || obj.ContentType || 'application/octet-stream' };
}
