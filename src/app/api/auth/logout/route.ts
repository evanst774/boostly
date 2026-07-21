// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, otpVerifications, twoFASessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { JWT_COOKIE_NAME } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        // Get the current token from the cookie
        const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

        if (token) {
            // Delete the specific session record for this token
            await db
                .delete(sessions)
                .where(eq(sessions.token, token));
        }

        // Get userId from headers (middleware injects x-user-id)
        const userId = request.headers.get('x-user-id');

        if (userId) {
            // Delete all pending 2FA login sessions for this user
            await db
                .delete(twoFASessions)
                .where(eq(twoFASessions.userId, userId));

            // Delete all unused 2FA_LOGIN OTPs for this user
            await db
                .delete(otpVerifications)
                .where(
                    and(
                        eq(otpVerifications.userId, userId),
                        eq(otpVerifications.type, '2FA_LOGIN'),
                        eq(otpVerifications.used, false)
                    )
                );
        }

        const response = NextResponse.json({ success: true });

        // ✅ Clear the auth cookie using JWT_COOKIE_NAME
        response.cookies.set(JWT_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        console.log('[LOGOUT] User logged out successfully', { userId });

        return response;
    } catch (error) {
        console.error('Logout error:', error);

        // Even if DB cleanup fails, still clear the cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set(JWT_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });
        return response;
    }
}