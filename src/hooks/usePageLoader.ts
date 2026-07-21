// hooks/usePageLoader.ts
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function usePageLoader() {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Show loader on route change
        const handleStart = () => setIsLoading(true);
        const handleComplete = () => {
            // Small delay to ensure smooth transition
            setTimeout(() => setIsLoading(false), 300);
        };

        // Initial load
        if (typeof window !== 'undefined') {
            // Hide loader after page is fully loaded
            window.addEventListener('load', handleComplete);

            // For Next.js route changes
            const originalPush = history.pushState;
            const originalReplace = history.replaceState;

            history.pushState = function (...args) {
                handleStart();
                originalPush.apply(this, args);
            };

            history.replaceState = function (...args) {
                handleStart();
                originalReplace.apply(this, args);
            };

            return () => {
                window.removeEventListener('load', handleComplete);
                history.pushState = originalPush;
                history.replaceState = originalReplace;
            };
        }
    }, []);

    // Hide loader after pathname changes
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    return isLoading;
}