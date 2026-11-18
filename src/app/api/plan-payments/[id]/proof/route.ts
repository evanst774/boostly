// src/app/api/plan-payments/[id]/proof/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPlanPaymentProof } from '@/modules/payments/plan-payments.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

/** Payment screenshot, for its owner or a reviewer only. Never cached publicly. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { bytes, contentType } = await getPlanPaymentProof(params.id);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  } catch (e) {
    return paymentErrorResponse(e, 'Plan payment proof');
  }
}
