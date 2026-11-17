// src/app/api/wallet/withdrawals/eligibility/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { getWithdrawalEligibility } from '@/modules/wallet/withdrawal-policy';

export const dynamic = 'force-dynamic';

/** Can the current user request a withdrawal now, and when would it be paid? */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await getWithdrawalEligibility(user.id));
  } catch (error) {
    console.error('Withdrawal eligibility error:', error);
    return NextResponse.json(
      { error: 'Failed to load withdrawal status' },
      { status: 500 },
    );
  }
}
