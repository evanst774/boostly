// src/app/api/admin/plan-payments/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rejectPlanPayment } from '@/modules/payments/plan-payments.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const payment = await rejectPlanPayment(params.id, String(body?.reason || ''));
    const { proofKey: _omit, ...safe } = payment;
    void _omit;
    return NextResponse.json({ payment: safe });
  } catch (e) {
    return paymentErrorResponse(e, 'Reject plan payment');
  }
}
