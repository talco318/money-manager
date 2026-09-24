import YahooFinance from 'yahoo-finance2';

// Create a single instance
const yahooFinance = new YahooFinance();

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
  marketState: string;
  lastUpdated: Date;
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

// Simple in-memory cache
const cache = new Map<string, { data: QuoteData; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get real-time quote for a single symbol
 */
export async function getQuote(symbol: string): Promise<QuoteData | null> {
  try {
    // Check cache first
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const quote = await yahooFinance.quote(symbol);
    
    if (!quote || !quote.regularMarketPrice) {
      return null;
    }

    const quoteData: QuoteData = {
      symbol: quote.symbol || symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
      currency: quote.currency || 'USD',
      marketState: quote.marketState || 'CLOSED',
      lastUpdated: new Date(),
    };

    // Update cache
    cache.set(symbol, { data: quoteData, timestamp: Date.now() });

    return quoteData;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get real-time quotes for multiple symbols
 */
export async function getQuotes(symbols: string[]): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();
  
  if (symbols.length === 0) {
    return results;
  }

  // Filter out symbols we have in cache
  const symbolsToFetch: string[] = [];
  for (const symbol of symbols) {
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(symbol, cached.data);
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  if (symbolsToFetch.length === 0) {
    return results;
  }

  try {
    // Fetch quotes in parallel but with small batches
    const batchSize = 10;
    for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
      const batch = symbolsToFetch.slice(i, i + batchSize);
      const promises = batch.map(async (symbol) => {
        const quote = await getQuote(symbol);
        if (quote) {
          results.set(symbol, quote);
        }
      });
      await Promise.all(promises);
    }
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
  }

  return results;
}

/**
 * Get USD/ILS exchange rate
 */
export async function getUsdIlsRate(): Promise<number> {
  try {
    const cached = cache.get('USDILS=X');
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data.price;
    }

    const quote = await yahooFinance.quote('USDILS=X');
    
    if (quote && quote.regularMarketPrice) {
      const quoteData: QuoteData = {
        symbol: 'USDILS=X',
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
        currency: 'ILS',
        marketState: quote.marketState || 'CLOSED',
        lastUpdated: new Date(),
      };
      
      cache.set('USDILS=X', { data: quoteData, timestamp: Date.now() });
      return quote.regularMarketPrice;
    }
    
    // Fallback rate if API fails
    return 3.7;
  } catch (error) {
    console.error('Error fetching USD/ILS rate:', error);
    return 3.7; // Fallback rate
  }
}

/**
 * Get historical data for a symbol
 */
export async function getHistoricalData(
  symbol: string,
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' = '1y'
): Promise<HistoricalData[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1mo':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3mo':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6mo':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '2y':
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      case '5y':
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      case 'max':
        startDate.setTime(new Date('2000-01-01').getTime());
        break;
    }

    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    return historical.map((item) => ({
      date: item.date,
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      volume: item.volume || 0,
      adjClose: item.adjClose || item.close || 0,
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Get S&P 500 historical data for comparison
 */
export async function getSP500Historical(
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' = '1y'
): Promise<HistoricalData[]> {
  return getHistoricalData('^GSPC', period);
}

/**
 * Clear the cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; symbols: string[] } {
  return {
    size: cache.size,
    symbols: Array.from(cache.keys()),
  };
}
