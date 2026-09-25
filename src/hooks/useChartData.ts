'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HistoricalData } from '@/lib/market';

export type Period = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

interface HoldingForChart {
  symbol: string;
  name: string;
  quantity: number;
  currentValue: number;
  percentage: number;
  color: string;
}

interface PerformanceDataPoint {
  date: string;
  portfolio: number;
  sp500: number;
  portfolioReturn: number;
  sp500Return: number;
}

interface UseChartDataResult {
  performanceData: PerformanceDataPoint[];
  allocationData: HoldingForChart[];
  sp500Data: HistoricalData[];
  isLoading: boolean;
  error: string | null;
  period: Period;
  setPeriod: (period: Period) => void;
  refresh: () => Promise<void>;
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export function useChartData(): UseChartDataResult {
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [allocationData, setAllocationData] = useState<HoldingForChart[]>([]);
  const [sp500Data, setSp500Data] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('1y');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch holdings for allocation chart
      const holdingsRes = await fetch('/api/holdings');
      const holdingsData = await holdingsRes.json();

      if (holdingsData.success && holdingsData.data.holdings) {
        const holdings = holdingsData.data.holdings;
        
        // Fetch current prices for all holdings
        const symbols = holdings.map((h: { symbol: string }) => h.symbol).join(',');
        let quotesMap = new Map<string, number>();
        
        if (symbols) {
          const quotesRes = await fetch(`/api/market?type=quote&symbols=${symbols}`);
          const quotesData = await quotesRes.json();
          
          if (quotesData.success && quotesData.data) {
            for (const quote of quotesData.data) {
              quotesMap.set(quote.symbol, quote.price);
            }
          }
        }

        // Fetch USD/ILS rate for proper multi-currency allocation
        const rateRes = await fetch('/api/market?type=usdils');
        const rateData = await rateRes.json();
        const rate = rateData.success ? rateData.data.rate : 3.7;

        // Calculate allocation data in consistent currency (ILS)
        let totalValueILS = 0;
        const allocations = holdings.map((h: { symbol: string; name: string; quantity: number; avgPrice: number; currency?: string }) => {
          const currentPrice = quotesMap.get(h.symbol) || h.avgPrice;
          const isUSD = (h.currency || '').toUpperCase() === 'USD';
          const valueNative = h.quantity * currentPrice;
          const valueILS = isUSD ? valueNative * rate : valueNative;
          totalValueILS += valueILS;
          return {
            symbol: h.symbol,
            name: h.name,
            quantity: h.quantity,
            currentValue: valueILS,
            percentage: 0,
            color: '',
          };
        });

        // Calculate percentages and assign colors
        const allocationWithPercent = allocations.map((a: HoldingForChart, i: number) => ({
          ...a,
          percentage: totalValueILS > 0 ? (a.currentValue / totalValueILS) * 100 : 0,
          color: COLORS[i % COLORS.length],
        }));

        // Sort by value descending
        allocationWithPercent.sort((a: HoldingForChart, b: HoldingForChart) => b.currentValue - a.currentValue);
        setAllocationData(allocationWithPercent);
      }

      // Fetch real comparison data
      const compRes = await fetch(`/api/market?type=comparison&period=${period}`);
      const compResult = await compRes.json();

      if (compResult.success && compResult.data?.history) {
        const history = compResult.data.history;
        const formatted: PerformanceDataPoint[] = history.map((pt: {
          date: string | Date;
          portfolio: number;
          sp500: number;
          portfolioReturn: number;
          sp500Return: number;
        }) => {
          const d = new Date(pt.date);
          let dateLabel = '';
          if (period === '1mo' || period === '3mo') {
            dateLabel = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
          } else {
            // For 6mo, 1y, 2y, 5y: include year so '24 בספט'' doesn't duplicate at both ends
            const m = d.toLocaleDateString('he-IL', { month: 'short' });
            const y = d.toLocaleDateString('he-IL', { year: '2-digit' });
            dateLabel = `${m} '${y}`;
          }

          return {
            date: dateLabel,
            portfolio: pt.portfolio,
            sp500: pt.sp500,
            portfolioReturn: pt.portfolioReturn,
            sp500Return: pt.sp500Return,
          };
        });

        setPerformanceData(formatted);
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים לגרפים');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    performanceData,
    allocationData,
    sp500Data,
    isLoading,
    error,
    period,
    setPeriod,
    refresh: fetchData,
  };
}
