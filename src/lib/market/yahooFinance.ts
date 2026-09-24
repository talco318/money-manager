import YahooFinance from 'yahoo-finance2';

// Create a single instance
const yahooFinance = new YahooFinance();

export interface QuoteData {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  volume?: number;
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

// Israeli securities proxy mapping to Yahoo Finance symbols
// Note: These funds trade in London/Europe in USD, and their TASE price is directly linked to them via USD/ILS rate!
const ISRAELI_PROXY_MAPPING: Record<string, { targetSymbol: string; inUSD: boolean }> = {
  // iShares Core S&P 500 UCITS ETF (TASE: 1159250 -> LSE: CSPX.L)
  '1159250': { targetSymbol: 'CSPX.L', inUSD: true },
  // iShares MSCI ACWI UCITS ETF (TASE: 1159235 -> LSE: ISAC.L)
  '1159235': { targetSymbol: 'ISAC.L', inUSD: true },
  // iShares Core MSCI EM IMI UCITS ETF (TASE: 1159169 -> LSE: EIMI.L)
  '1159169': { targetSymbol: 'EIMI.L', inUSD: true },
  // Invesco S&P 500 UCITS ETF (TASE: 1183441 -> LSE: SPXS.L)
  '1183441': { targetSymbol: 'SPXS.L', inUSD: true },
};

// Fallback market prices for Israeli securities without Yahoo Finance listing
const ISRAELI_FALLBACK_PRICES: Record<string, { price: number; name?: string }> = {
  // ATF סל ת"א 125
  '1238203': { price: 48.92, name: 'ATF סל ת"א 125' },
  // הרל.אינ בנק ישר
  '1148949': { price: 78.33, name: 'הרל.אינ בנק ישר' },
};

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

    const proxy = ISRAELI_PROXY_MAPPING[symbol];
    const fetchSymbol = proxy ? proxy.targetSymbol : symbol;

    let quote = null;
    try {
      quote = await yahooFinance.quote(fetchSymbol);
    } catch {
      // Fallback below
    }
    
    if (!quote || !quote.regularMarketPrice) {
      const fallback = ISRAELI_FALLBACK_PRICES[symbol];
      if (fallback) {
        const quoteData: QuoteData = {
          symbol,
          name: fallback.name,
          price: fallback.price,
          change: 0,
          changePercent: 0,
          previousClose: fallback.price,
          currency: 'ILS',
          marketState: 'CLOSED',
          lastUpdated: new Date(),
        };
        cache.set(symbol, { data: quoteData, timestamp: Date.now() });
        return quoteData;
      }
      return null;
    }

    let price = quote.regularMarketPrice;
    let change = quote.regularMarketChange || 0;
    let previousClose = quote.regularMarketPreviousClose || price;
    let currency = quote.currency || 'USD';

    // If this is an Israeli fund mapped to an international USD UCITS ETF, convert to ILS
    if (proxy && proxy.inUSD) {
      const rate = await getUsdIlsRate();
      price = Number((price * rate).toFixed(2));
      change = Number((change * rate).toFixed(2));
      previousClose = Number((previousClose * rate).toFixed(2));
      currency = 'ILS';
    }

    const quoteData: QuoteData = {
      symbol: symbol, // Return the requested symbol
      name: quote.shortName || quote.longName,
      price,
      change,
      changePercent: quote.regularMarketChangePercent || 0,
      previousClose,
      dayHigh: quote.regularMarketDayHigh ? (proxy?.inUSD ? Number((quote.regularMarketDayHigh * (await getUsdIlsRate())).toFixed(2)) : quote.regularMarketDayHigh) : undefined,
      dayLow: quote.regularMarketDayLow ? (proxy?.inUSD ? Number((quote.regularMarketDayLow * (await getUsdIlsRate())).toFixed(2)) : quote.regularMarketDayLow) : undefined,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      marketCap: quote.marketCap,
      volume: quote.regularMarketVolume,
      currency,
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

    const proxy = ISRAELI_PROXY_MAPPING[symbol];
    const fetchSymbol = proxy ? proxy.targetSymbol : symbol;
    const rate = (proxy && proxy.inUSD) ? await getUsdIlsRate() : 1;

    const historical = await yahooFinance.historical(fetchSymbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    return historical.map((item) => ({
      date: item.date,
      open: (item.open || 0) * rate,
      high: (item.high || 0) * rate,
      low: (item.low || 0) * rate,
      close: (item.close || 0) * rate,
      volume: item.volume || 0,
      adjClose: (item.adjClose || item.close || 0) * rate,
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
