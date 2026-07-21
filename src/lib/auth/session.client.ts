// src/lib/auth/session.client.ts
'use client';

import { useEffect, useState } from 'react';

interface SessionUser {
    userId: string;
    email: string;
    name: string;
    role: string;
    roles: string[];
}

// uses fetch API instead of next/headers
export async function getClientSession(): Promise<SessionUser | null> {
    try {
        const res = await fetch('/api/auth/session', {
            credentials: 'include',
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.session;
    } catch (error) {
        console.error('Error getting client session:', error);
        return null;
    }
}

// React hook for client components
export function useSession() {
    const [session, setSession] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const sessionData = await getClientSession();
                setSession(sessionData);
            } catch (error) {
                console.error('Error fetching session:', error);
                setSession(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
    }, []);

    return { session, isLoading };
}