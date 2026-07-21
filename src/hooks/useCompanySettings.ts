// src/hooks/useCompanySettings.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { CompanySettings } from '@/lib/db/schema/company';

// Simple cache
let cachedSettings: CompanySettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(
    cachedSettings,
  );
  const [loading, setLoading] = useState(!cachedSettings);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const fetchSettings = useCallback(async (force = false) => {
    // Check cache first
    if (!force && cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const companyData = data?.company || null;

        // Update cache
        cachedSettings = companyData;
        cacheTimestamp = Date.now();

        if (isMounted.current) {
          setSettings(companyData);
        }
      } else {
        throw new Error('Failed to fetch company settings');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
      console.error('Failed to fetch company settings:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchSettings();
    return () => {
      isMounted.current = false;
    };
  }, [fetchSettings]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cachedSettings = null;
    cacheTimestamp = 0;
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: () => fetchSettings(true),
    clearCache,
  };
}
