// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session.server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'No session' }, { status: 401 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Session API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}