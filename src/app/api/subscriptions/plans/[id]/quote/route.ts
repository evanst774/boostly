// GET /api/subscriptions/plans/{id}/quote?cycle=MONTHLY|YEARLY
// What the signed-in member would pay now (new / renewal / upgrade credit),
// the same figure both checkout methods charge.
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { subscriptionPlans } from '@/lib/db/schema';
import { quotePlan } from '@/modules/badges/plan-quote';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, params.id) });
  if (!plan || !plan.isActive) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  const cycle = request.nextUrl.searchParams.get('cycle') === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
  return NextResponse.json(await quotePlan(user.id, plan, cycle));
}
