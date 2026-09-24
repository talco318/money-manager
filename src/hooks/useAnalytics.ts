'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DividendBySymbol {
  symbol: string;
  name: string | null;
  total: number;
  count: number;
}

export interface DividendByMonth {
  month: string;
  total: number;
}

export interface CommissionByMonth {
  month: string;
  commission: number;
  fees: number;
  total: number;
}

export interface DividendAnalytics {
  total: number;
  totalTax: number;
  netTotal: number;
  bySymbol: DividendBySymbol[];
  byMonth: DividendByMonth[];
}

export interface CommissionAnalytics {
  totalCommissions: number;
  totalFees: number;
  grandTotal: number;
  byMonth: CommissionByMonth[];
  avgPerTransaction: number;
  transactionCount: number;
}

interface UseAnalyticsResult {
  dividends: DividendAnalytics | null;
  commissions: CommissionAnalytics | null;
  isLoading: boolean;
  error: string | null;
  year: string;
  setYear: (year: string) => void;
  refresh: () => Promise<void>;
}

export function useAnalytics(): UseAnalyticsResult {
  const [dividends, setDividends] = useState<DividendAnalytics | null>(null);
  const [commissions, setCommissions] = useState<CommissionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = year 
        ? `/api/analytics?type=all&year=${year}`
        : '/api/analytics?type=all';
        
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setDividends(data.data.dividends || null);
      setCommissions(data.data.commissions || null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dividends,
    commissions,
    isLoading,
    error,
    year,
    setYear,
    refresh: fetchData,
  };
}
