// src/app/api/auth/debug-cookie/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { JWT_COOKIE_NAME } from '@/lib/jwt';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

    let payload = null;
    if (token) {
        payload = await verifyJWT(token);
    }

    return NextResponse.json({
        hasCookie: !!token,
        cookieName: JWT_COOKIE_NAME,
        tokenPreview: token ? `${token.substring(0, 30)}...` : null,
        payload: payload ? {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            roles: payload.roles,
        } : null,
        allCookies: request.cookies.getAll().map(c => c.name),
    });
}