'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HoldingWithMarketData, PortfolioSummary } from '@/types';

interface HoldingFromAPI {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  totalCost: number;
  currency: string;
}

interface QuoteFromAPI {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
  marketState: string;
}

interface UsePortfolioResult {
  holdings: HoldingWithMarketData[];
  summary: PortfolioSummary | null;
  usdIlsRate: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function usePortfolio(): UsePortfolioResult {
  const [holdings, setHoldings] = useState<HoldingWithMarketData[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [usdIlsRate, setUsdIlsRate] = useState<number>(3.7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch holdings from database
      const holdingsRes = await fetch('/api/holdings');
      const holdingsData = await holdingsRes.json();

      if (!holdingsData.success) {
        throw new Error(holdingsData.error || 'Failed to fetch holdings');
      }

      const dbHoldings: HoldingFromAPI[] = holdingsData.data.holdings || [];

      if (dbHoldings.length === 0) {
        // No holdings, set empty state
        setHoldings([]);
        setSummary({
          totalValue: 0,
          totalValueILS: 0,
          totalCost: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          cashBalance: holdingsData.data.cashBalance?.ils || 0,
          cashBalanceILS: holdingsData.data.cashBalance?.ils || 0,
          holdings: [],
        });
        setIsLoading(false);
        setLastUpdated(new Date());
        return;
      }

      // Fetch USD/ILS rate
      const rateRes = await fetch('/api/market?type=usdils');
      const rateData = await rateRes.json();
      const rate = rateData.success ? rateData.data.rate : 3.7;
      setUsdIlsRate(rate);

      // Fetch market quotes for all symbols
      const symbols = dbHoldings.map(h => h.symbol).join(',');
      const quotesRes = await fetch(`/api/market?type=quote&symbols=${symbols}`);
      const quotesData = await quotesRes.json();
      
      const quotesMap = new Map<string, QuoteFromAPI>();
      if (quotesData.success && quotesData.data) {
        for (const quote of quotesData.data) {
          quotesMap.set(quote.symbol, quote);
        }
      }

      // Combine holdings with market data
      let totalValue = 0;
      let totalCost = 0;
      let totalDayChange = 0;

      const enrichedHoldings: HoldingWithMarketData[] = dbHoldings.map(holding => {
        const quote = quotesMap.get(holding.symbol);
        const currentPrice = quote?.price || holding.avgPrice;
        const currentValue = holding.quantity * currentPrice;
        const pnl = currentValue - holding.totalCost;
        const pnlPercent = holding.totalCost > 0 ? (pnl / holding.totalCost) * 100 : 0;
        const dayChange = quote ? holding.quantity * quote.change : 0;
        const dayChangePercent = quote?.changePercent || 0;

        totalValue += currentValue;
        totalCost += holding.totalCost;
        totalDayChange += dayChange;

        return {
          id: holding.id,
          symbol: holding.symbol,
          name: holding.name,
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
          currency: holding.currency,
          totalCost: holding.totalCost,
          currentPrice,
          currentValue,
          pnl,
          pnlPercent,
          dayChange,
          dayChangePercent,
        };
      });

      // Sort by value (largest first)
      enrichedHoldings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));

      const totalPnL = totalValue - totalCost;
      const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
      const dayChangePercent = totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;

      setHoldings(enrichedHoldings);
      setSummary({
        totalValue,
        totalValueILS: totalValue * rate,
        totalCost,
        totalPnL,
        totalPnLPercent,
        dayChange: totalDayChange,
        dayChangePercent,
        cashBalance: holdingsData.data.cashBalance?.ils || 0,
        cashBalanceILS: holdingsData.data.cashBalance?.ils || 0,
        holdings: enrichedHoldings,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    holdings,
    summary,
    usdIlsRate,
    isLoading,
    error,
    refresh: fetchData,
    lastUpdated,
  };
}
