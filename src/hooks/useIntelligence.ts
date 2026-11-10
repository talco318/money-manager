'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IntelligenceResult } from '@/lib/analytics/intelligence';

const CACHE_KEY = 'mm_intelligence_cache_v1';

export function useIntelligence() {
  const [data, setData] = useState<IntelligenceResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/analytics?type=intelligence');
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch intelligence data');
      }
      setData(json.data);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
      } catch {
        // Ignore localStorage quota
      }
    } catch (err) {
      console.error('Error fetching intelligence:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Instant load from local cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.positions) {
          setData(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // Ignore
    }

    // 2. Fresh background fetch
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading: isLoading && !data,
    error,
    refresh: fetchData,
  };
}

