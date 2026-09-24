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

      // Fetch holdings from database (with sync)
      const holdingsRes = await fetch('/api/holdings?refresh=true');
      const holdingsData = await holdingsRes.json();

      if (!holdingsData.success) {
        throw new Error(holdingsData.error || 'Failed to fetch holdings');
      }

      const dbHoldings: HoldingFromAPI[] = holdingsData.data.holdings || [];

      // Fetch USD/ILS rate
      const rateRes = await fetch('/api/market?type=usdils');
      const rateData = await rateRes.json();
      const rate = rateData.success ? rateData.data.rate : 3.7;
      setUsdIlsRate(rate);

      if (dbHoldings.length === 0) {
        // No holdings, set empty state
        setHoldings([]);
        const emptyCashILS = holdingsData.data.cashBalance?.ils || 0;
        const emptyCashUSD = holdingsData.data.cashBalance?.usd || 0;
        const emptyTotalCashILS = emptyCashILS + (emptyCashUSD * rate);
        setSummary({
          totalValue: rate > 0 ? emptyTotalCashILS / rate : 0,
          totalValueILS: emptyTotalCashILS,
          totalCost: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          cashBalance: emptyTotalCashILS,
          cashBalanceILS: emptyCashILS,
          cashBalanceUSD: emptyCashUSD,
          totalCashILS: emptyTotalCashILS,
          holdings: [],
        });
        setIsLoading(false);
        setLastUpdated(new Date());
        return;
      }

      // Fetch market quotes for all symbols
      const symbols = dbHoldings.map(h => h.symbol).join(',');
      const quotesRes = await fetch(`/api/market?type=quote&symbols=${symbols}`);
      const quotesData = await quotesRes.json();
      
      const quotesMap = new Map<string, QuoteFromAPI>();
      if (quotesData.success && quotesData.data) {
        // Handle both array and single object responses
        const quotesArray = Array.isArray(quotesData.data) ? quotesData.data : [quotesData.data];
        for (const quote of quotesArray) {
          if (quote && quote.symbol) {
            quotesMap.set(quote.symbol, quote);
          }
        }
      }

      // Combine holdings with market data
      let totalSecuritiesValueILS = 0;
      let totalSecuritiesCostILS = 0;
      let totalSecuritiesDayChangeILS = 0;

      const enrichedHoldings: HoldingWithMarketData[] = dbHoldings.map(holding => {
        const quote = quotesMap.get(holding.symbol);
        const hasLiveQuote = Boolean(quote && quote.price && quote.price > 0);
        const currentPrice = hasLiveQuote ? (quote?.price || 0) : holding.avgPrice;
        
        const isUSD = (holding.currency || '').toUpperCase() === 'USD';
        
        // Native currency values
        const currentValueNative = holding.quantity * currentPrice;
        const totalCostNative = holding.totalCost;
        const pnlNative = currentValueNative - totalCostNative;
        const pnlPercent = totalCostNative > 0 ? (pnlNative / totalCostNative) * 100 : 0;
        
        // Daily change
        const dayChangeNative = hasLiveQuote && quote ? holding.quantity * quote.change : 0;
        const dayChangePercent = hasLiveQuote && quote ? quote.changePercent : 0;

        // Multi-currency conversions
        let currentValueUSD = 0;
        let currentValueILS = 0;
        let totalCostUSD = 0;
        let totalCostILS = 0;
        let dayChangeILS = 0;

        if (isUSD) {
          currentValueUSD = currentValueNative;
          currentValueILS = currentValueNative * rate;
          totalCostUSD = totalCostNative;
          totalCostILS = totalCostNative * rate;
          dayChangeILS = dayChangeNative * rate;
        } else {
          // ILS
          currentValueILS = currentValueNative;
          currentValueUSD = rate > 0 ? currentValueNative / rate : 0;
          totalCostILS = totalCostNative;
          totalCostUSD = rate > 0 ? totalCostNative / rate : 0;
          dayChangeILS = dayChangeNative;
        }

        totalSecuritiesValueILS += currentValueILS;
        totalSecuritiesCostILS += totalCostILS;
        totalSecuritiesDayChangeILS += dayChangeILS;

        return {
          id: holding.id,
          symbol: holding.symbol,
          name: holding.name,
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
          currency: holding.currency || 'USD',
          totalCost: totalCostNative,
          currentPrice,
          currentValue: currentValueNative,
          pnl: pnlNative,
          pnlPercent,
          dayChange: dayChangeNative,
          dayChangePercent,
          hasLiveQuote,
          currentValueILS,
          currentValueUSD,
          totalCostILS,
          totalCostUSD,
        };
      });

      // Sort by value in ILS (largest first)
      enrichedHoldings.sort((a, b) => (b.currentValueILS || 0) - (a.currentValueILS || 0));

      // Cash balances
      const cashILS = holdingsData.data.cashBalance?.ils || 0;
      const cashUSD = holdingsData.data.cashBalance?.usd || 0;
      const totalCashILS = cashILS + (cashUSD * rate);

      const portfolioTotalValueILS = totalSecuritiesValueILS + totalCashILS;
      const portfolioTotalValueUSD = rate > 0 ? portfolioTotalValueILS / rate : 0;

      const totalPnLILS = totalSecuritiesValueILS - totalSecuritiesCostILS;
      const totalPnLUSD = rate > 0 ? totalPnLILS / rate : 0;
      const totalPnLPercent = totalSecuritiesCostILS > 0 ? (totalPnLILS / totalSecuritiesCostILS) * 100 : 0;

      const totalDayChangeUSD = rate > 0 ? totalSecuritiesDayChangeILS / rate : 0;
      const dayChangePercent = totalSecuritiesValueILS > 0 
        ? (totalSecuritiesDayChangeILS / (totalSecuritiesValueILS - totalSecuritiesDayChangeILS)) * 100 
        : 0;

      setHoldings(enrichedHoldings);
      setSummary({
        totalValue: portfolioTotalValueUSD,
        totalValueILS: portfolioTotalValueILS,
        totalCost: rate > 0 ? totalSecuritiesCostILS / rate : 0,
        totalPnL: totalPnLUSD,
        totalPnLPercent,
        dayChange: totalDayChangeUSD,
        dayChangePercent,
        cashBalance: totalCashILS,
        cashBalanceILS: cashILS,
        cashBalanceUSD: cashUSD,
        totalCashILS,
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
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    
    return () => clearInterval(interval);
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
