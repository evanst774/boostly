// src/app/api/plan-payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getMyPlanPayments,
  submitPlanPayment,
  PlanPaymentError,
} from '@/modules/payments/plan-payments.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

/** The signed-in member's plan payments (newest first). */
export async function GET() {
  try {
    return NextResponse.json({ payments: await getMyPlanPayments() });
  } catch (e) {
    return paymentErrorResponse(e, 'Plan payments list');
  }
}

/** Submit a mobile money payment for a plan (multipart form). */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const proof = form.get('proof');
    if (!(proof instanceof File) || proof.size === 0) {
      throw new PlanPaymentError(400, 'Add a screenshot of your payment confirmation.');
    }
    const cycle = form.get('billingCycle') === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
    const payment = await submitPlanPayment({
      planId: String(form.get('planId') || ''),
      billingCycle: cycle,
      payerPhone: String(form.get('payerPhone') || ''),
      transactionRef: String(form.get('transactionRef') || ''),
      proof,
    });
    const { proofKey: _omit, ...safe } = payment;
    void _omit;
    return NextResponse.json({ payment: safe }, { status: 201 });
  } catch (e) {
    return paymentErrorResponse(e, 'Plan payment submit');
  }
}
