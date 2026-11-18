// src/app/api/admin/settings/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import {
  getMomoDetails,
  updateMomoDetails,
} from '@/modules/payments/plan-payments.service';
import { paymentErrorResponse } from '@/modules/payments/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission(PermissionKeys.ADMIN_SETTINGS);
    return NextResponse.json(await getMomoDetails());
  } catch (e) {
    return paymentErrorResponse(e, 'Payment settings');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(
      await updateMomoDetails({
        mtnNumber: body?.mtnNumber,
        airtelNumber: body?.airtelNumber,
        accountName: body?.accountName,
      }),
    );
  } catch (e) {
    return paymentErrorResponse(e, 'Update payment settings');
  }
}
