// src/app/api/admin/plan-payments/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { approvePlanPayment } from '@/modules/payments/plan-payments.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

/** Confirms the MoMo payment and activates the member's plan. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({ payment: await approvePlanPayment(params.id) });
  } catch (e) {
    return paymentErrorResponse(e, 'Approve plan payment');
  }
}
