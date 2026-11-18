// src/app/api/payments/momo/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { getMomoDetails } from '@/modules/payments/plan-payments.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

/** Where members send plan payments (signed-in members only). */
export async function GET() {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await getMomoDetails());
  } catch (e) {
    return paymentErrorResponse(e, 'MoMo details');
  }
}
