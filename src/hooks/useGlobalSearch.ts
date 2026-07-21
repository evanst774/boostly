// src/hooks/useGlobalSearch.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchGroupResult } from '@/lib/search/types';

const RECENT_KEY = 'mototrack:recent-searches';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 250;

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<SearchGroupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored) as string[]);
    } catch {
      // localStorage unavailable or corrupted — ignore
    }
  }, []);

  const pushRecent = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setRecent((prev) => {
      const next = [
        trimmed,
        ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT);

      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore write failures
      }

      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setLoading(false);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        credentials: 'include',
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Search request failed');
          return res.json();
        })
        .then((data: { groups: SearchGroupResult[] }) => {
          setGroups(data.groups ?? []);
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') {
            setError('Something went wrong while searching.');
            setGroups([]);
          }
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return {
    query,
    setQuery,
    groups,
    loading,
    error,
    recent,
    pushRecent,
    clearRecent,
  };
}
