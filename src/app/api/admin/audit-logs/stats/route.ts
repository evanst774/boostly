// src/app/api/admin/audit-logs/stats/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(PermissionKeys.AUDIT_READ);

    // Get counts by action category - BOOSTLY UPDATED
    const counts = await db.run(sql`
            SELECT 
                COUNT(*) as total,
                SUM(CASE 
                    WHEN action LIKE '%CREATED%' OR action LIKE '%UPDATED%' OR action LIKE '%PUBLISHED%' 
                    THEN 1 ELSE 0 END) as edits,
                SUM(CASE 
                    WHEN action LIKE '%DELETED%' OR action LIKE '%CANCELLED%' OR action LIKE '%REJECTED%' 
                    THEN 1 ELSE 0 END) as deletes,
                SUM(CASE 
                    WHEN action LIKE '%REWARD%' OR action LIKE '%BONUS%' OR action LIKE '%CLAIMED%' 
                    THEN 1 ELSE 0 END) as rewards,
                SUM(CASE 
                    WHEN action LIKE '%VIDEO%' OR action LIKE '%GAME%' OR action LIKE '%SURVEY%' 
                    THEN 1 ELSE 0 END) as content,
                SUM(CASE 
                    WHEN action LIKE '%WALLET%' OR action LIKE '%TRANSACTION%' OR action LIKE '%WITHDRAWAL%' 
                    THEN 1 ELSE 0 END) as wallet,
                SUM(CASE 
                    WHEN action LIKE '%LOGIN%' OR action LIKE '%LOGOUT%' OR action LIKE '%PASSWORD%' 
                    THEN 1 ELSE 0 END) as auth
            FROM audit_logs
        `);

    const result = counts.rows?.[0] || {
      total: 0,
      edits: 0,
      deletes: 0,
      rewards: 0,
      content: 0,
      wallet: 0,
      auth: 0,
    };

    return NextResponse.json({
      total: Number(result.total) || 0,
      edits: Number(result.edits) || 0,
      deletes: Number(result.deletes) || 0,
      rewards: Number(result.rewards) || 0,
      content: Number(result.content) || 0,
      wallet: Number(result.wallet) || 0,
      auth: Number(result.auth) || 0,
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
