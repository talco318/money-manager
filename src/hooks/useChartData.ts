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

        // Calculate allocation data
        let totalValue = 0;
        const allocations = holdings.map((h: { symbol: string; name: string; quantity: number; avgPrice: number }) => {
          const currentPrice = quotesMap.get(h.symbol) || h.avgPrice;
          const currentValue = h.quantity * currentPrice;
          totalValue += currentValue;
          return {
            symbol: h.symbol,
            name: h.name,
            quantity: h.quantity,
            currentValue,
            percentage: 0,
            color: '',
          };
        });

        // Calculate percentages and assign colors
        const allocationWithPercent = allocations.map((a: HoldingForChart, i: number) => ({
          ...a,
          percentage: totalValue > 0 ? (a.currentValue / totalValue) * 100 : 0,
          color: COLORS[i % COLORS.length],
        }));

        // Sort by value descending
        allocationWithPercent.sort((a: HoldingForChart, b: HoldingForChart) => b.currentValue - a.currentValue);
        setAllocationData(allocationWithPercent);
      }

      // Fetch S&P 500 historical data
      const sp500Res = await fetch(`/api/market?type=sp500&period=${period}`);
      const sp500Result = await sp500Res.json();

      if (sp500Result.success && sp500Result.data.history) {
        setSp500Data(sp500Result.data.history);

        // Build performance comparison data
        // For now, we'll simulate portfolio performance as we don't have historical snapshots
        const history = sp500Result.data.history;
        if (history.length > 0) {
          const baseValue = history[0].close;
          const performance: PerformanceDataPoint[] = history.map((point: HistoricalData) => {
            const sp500Return = ((point.close - baseValue) / baseValue) * 100;
            // Simulate portfolio return (in a real app, this would come from portfolio snapshots)
            const portfolioReturn = sp500Return * (0.8 + Math.random() * 0.4); // Simulated variance
            
            return {
              date: new Date(point.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
              portfolio: 100 + portfolioReturn,
              sp500: 100 + sp500Return,
              portfolioReturn,
              sp500Return,
            };
          });

          setPerformanceData(performance);
        }
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
