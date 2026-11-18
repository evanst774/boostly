// src/app/api/admin/plan-payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listPlanPayments } from '@/modules/payments/plan-payments.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';
    return NextResponse.json(await listPlanPayments(status));
  } catch (e) {
    return paymentErrorResponse(e, 'Admin plan payments');
  }
}
