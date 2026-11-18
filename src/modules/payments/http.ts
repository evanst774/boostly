// src/modules/payments/http.ts
import { NextResponse } from 'next/server';
import { PlanPaymentError } from './plan-payments.service';

/** Map service errors to JSON responses with the right status. */
export function paymentErrorResponse(error: unknown, label: string) {
  if (error instanceof PlanPaymentError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : '';
  if (message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (/^Forbidden/.test(message)) {
    return NextResponse.json({ error: 'You do not have access to this.' }, { status: 403 });
  }
  console.error(`${label}:`, error);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
