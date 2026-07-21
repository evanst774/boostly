// src/lib/db/2fa-utils.ts
import { db } from './index';
import { twoFASessions } from './schema';
import { eq, lt } from 'drizzle-orm';
import crypto from 'crypto';

const SESSION_TTL = 10 * 60 * 1000; // 10 minutes

export async function create2FASession(userId: string): Promise<string> {
    // Clean up expired sessions
    await db
        .delete(twoFASessions)
        .where(lt(twoFASessions.expiresAt, new Date().toISOString()));

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL);

    await db.insert(twoFASessions).values({
        id: sessionId,
        userId: userId,
        expiresAt: expiresAt.toISOString(),
    });

    return sessionId;
}

export async function verify2FASession(sessionId: string): Promise<string | null> {
    const session = await db
        .select()
        .from(twoFASessions)
        .where(eq(twoFASessions.id, sessionId))
        .limit(1);

    if (!session[0] || new Date(session[0].expiresAt) < new Date()) {
        return null;
    }

    // Delete the session after use (one-time use)
    await db
        .delete(twoFASessions)
        .where(eq(twoFASessions.id, sessionId));

    return session[0].userId;
}

// Optional: Clean up expired sessions (can be called periodically)
export async function cleanupExpiredTwoFASessions(): Promise<void> {
    await db
        .delete(twoFASessions)
        .where(lt(twoFASessions.expiresAt, new Date().toISOString()));
}