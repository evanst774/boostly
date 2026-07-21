// src/app/api/public/withdrawals/recent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withdrawals } from '@/lib/db/schema/wallet';
import { users } from '@/lib/db/schema/users';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent completed withdrawals with user info
    const recentWithdrawals = await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        currency: withdrawals.currency,
        method: withdrawals.method,
        completedAt: withdrawals.completedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .where(
        and(
          eq(withdrawals.status, 'COMPLETED'),
          sql`${withdrawals.completedAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(withdrawals.completedAt))
      .limit(limit);

    // Format for public display (hide full names for privacy)
    const formatted = recentWithdrawals.map((w) => {
      // Only show first name or initials for privacy
      const nameParts = w.userName?.split(' ') || ['User'];
      const displayName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` // e.g., "John D."
          : nameParts[0] || 'Anonymous';

      return {
        id: w.id,
        displayName: displayName,
        amount: w.amount,
        currency: w.currency || 'RWF',
        method: w.method,
        timeAgo: formatTimeAgo(w.completedAt),
        timestamp: w.completedAt,
      };
    });

    return NextResponse.json({
      withdrawals: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching recent withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent withdrawals' },
      { status: 500 },
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: string | null): string {
  if (!date) return 'recently';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}
