// src/app/api/admin/settings/reward-budget/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRewardBudgetStatus, setDailyRewardBudget } from '@/modules/rewards/budget.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getRewardBudgetStatus());
  } catch (e) {
    return paymentErrorResponse(e, 'Reward budget');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = body?.dailyRewardBudget;
    const amount = raw === null || raw === '' || raw === undefined ? null : Number(raw);
    return NextResponse.json(await setDailyRewardBudget(amount));
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.startsWith('Enter a budget')) return NextResponse.json({ error: msg }, { status: 400 });
    return paymentErrorResponse(e, 'Update reward budget');
  }
}
