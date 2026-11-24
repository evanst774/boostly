// /api/user/sessions — the member's real signed-in sessions.
//   GET                      list (newest first), current one marked
//   DELETE ?id=<sessionId>   sign out that session (not the current one)
//   DELETE ?all=others       sign out every session except this one
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gt, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { getCurrentSession } from '@/lib/db/auth-utils';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentSession();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await db
    .select({ id: sessions.id, createdAt: sessions.createdAt, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(and(eq(sessions.userId, current.user.id), gt(sessions.expiresAt, new Date().toISOString())))
    .orderBy(desc(sessions.createdAt))
    .limit(20);
  return NextResponse.json({
    sessions: rows.map((r) => ({ ...r, current: r.id === current.session.id })),
  });
}

export async function DELETE(request: NextRequest) {
  const current = await getCurrentSession();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = current.user.id;
  const id = request.nextUrl.searchParams.get('id');
  const all = request.nextUrl.searchParams.get('all') === 'others';

  if (!id && !all) return NextResponse.json({ error: 'Nothing to sign out' }, { status: 400 });
  if (id && id === current.session.id) {
    return NextResponse.json({ error: 'Use Sign out to end this session' }, { status: 400 });
  }

  const removed = await db
    .delete(sessions)
    .where(
      all
        ? and(eq(sessions.userId, userId), ne(sessions.id, current.session.id))
        : and(eq(sessions.userId, userId), eq(sessions.id, id!)),
    )
    .returning({ id: sessions.id });

  await createAuditLog({
    userId,
    action: 'LOGOUT',
    entityType: 'session',
    entityId: all ? 'others' : id!,
    newData: { signedOut: removed.length },
  }).catch(() => undefined);

  return NextResponse.json({ signedOut: removed.length });
}
