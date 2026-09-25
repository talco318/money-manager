import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  getQuote, 
  getQuotes, 
  getUsdIlsRate, 
  getHistoricalData,
  getSP500Historical,
  getCacheStats 
} from '@/lib/market';

/**
 * GET /api/market - Get market data
 * 
 * Query params:
 * - symbol: Single symbol to fetch
 * - symbols: Comma-separated list of symbols
 * - type: 'quote' | 'historical' | 'sp500' | 'usdils' | 'stats'
 * - period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' (for historical)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'quote';
    const symbol = searchParams.get('symbol');
    const symbolsParam = searchParams.get('symbols');
    const period = searchParams.get('period') as '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' || '1y';

    switch (type) {
      case 'quote': {
        if (symbolsParam) {
          // Multiple symbols
          const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
          const quotes = await getQuotes(symbols);
          const quotesArray = Array.from(quotes.entries()).map(([sym, data]) => ({
            ...data,
            symbol: sym,
          }));
          
          return NextResponse.json({
            success: true,
            data: quotesArray,
          });
        } else if (symbol) {
          // Single symbol
          const quote = await getQuote(symbol.toUpperCase());
          
          if (!quote) {
            return NextResponse.json(
              { success: false, error: `לא נמצא מידע עבור הסמל ${symbol}` },
              { status: 404 }
            );
          }
          
          return NextResponse.json({
            success: true,
            data: quote,
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'יש לספק symbol או symbols' },
            { status: 400 }
          );
        }
      }

      case 'historical': {
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'יש לספק symbol לנתונים היסטוריים' },
            { status: 400 }
          );
        }

        const historical = await getHistoricalData(symbol.toUpperCase(), period);
        
        return NextResponse.json({
          success: true,
          data: {
            symbol: symbol.toUpperCase(),
            period,
            history: historical,
          },
        });
      }

      case 'sp500': {
        const sp500Data = await getSP500Historical(period);
        
        return NextResponse.json({
          success: true,
          data: {
            symbol: '^GSPC',
            name: 'S&P 500',
            period,
            history: sp500Data,
          },
        });
      }

      case 'comparison': {
        const holdings = await prisma.holding.findMany();
        const sp500Data = await getSP500Historical(period);

        if (!sp500Data || sp500Data.length === 0) {
          return NextResponse.json({ success: true, data: { history: [] } });
        }

        const baseSp = sp500Data[0].close || 1;

        // If no holdings, return S&P 500 alone
        if (holdings.length === 0) {
          const comparison = sp500Data.map(pt => {
            const spRet = ((pt.close - baseSp) / baseSp) * 100;
            return {
              date: pt.date,
              portfolio: 100,
              sp500: 100 + spRet,
              portfolioReturn: 0,
              sp500Return: spRet,
              alpha: -spRet,
            };
          });
          return NextResponse.json({ success: true, data: { history: comparison } });
        }

        // Calculate holding weights
        const totalPortfolioCost = holdings.reduce((sum, h) => sum + h.totalCost, 0) || 1;
        const assetWeights = holdings.map(h => ({
          symbol: h.symbol,
          weight: h.totalCost / totalPortfolioCost,
        }));

        // Fetch historical data for holdings
        const assetHistories = await Promise.all(
          assetWeights.map(async (a) => {
            try {
              const h = await getHistoricalData(a.symbol, period);
              return { symbol: a.symbol, weight: a.weight, history: h };
            } catch {
              return { symbol: a.symbol, weight: a.weight, history: [] };
            }
          })
        );

        const assetBases = assetHistories.map(a => a.history[0]?.close || 0);

        const comparison = sp500Data.map(pt => {
          const ptTime = new Date(pt.date).toISOString().slice(0, 10);
          const spRet = ((pt.close - baseSp) / baseSp) * 100;

          let weightedReturn = 0;
          let coveredWeight = 0;

          for (let i = 0; i < assetHistories.length; i++) {
            const asset = assetHistories[i];
            const basePrice = assetBases[i];
            if (basePrice > 0 && asset.history.length > 0) {
              const match = asset.history.find(h => new Date(h.date).toISOString().slice(0, 10) === ptTime);
              if (match) {
                const ret = ((match.close - basePrice) / basePrice) * 100;
                weightedReturn += ret * asset.weight;
                coveredWeight += asset.weight;
              }
            }
          }

          const portRet = coveredWeight > 0 ? (weightedReturn / coveredWeight) : spRet;

          return {
            date: pt.date,
            portfolio: Number((100 + portRet).toFixed(2)),
            sp500: Number((100 + spRet).toFixed(2)),
            portfolioReturn: Number(portRet.toFixed(2)),
            sp500Return: Number(spRet.toFixed(2)),
            alpha: Number((portRet - spRet).toFixed(2)),
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            history: comparison,
          },
        });
      }

      case 'usdils': {
        const rate = await getUsdIlsRate();
        
        return NextResponse.json({
          success: true,
          data: {
            pair: 'USD/ILS',
            rate,
            lastUpdated: new Date().toISOString(),
          },
        });
      }

      case 'stats': {
        const stats = getCacheStats();
        
        return NextResponse.json({
          success: true,
          data: stats,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `סוג לא מוכר: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בטעינת נתוני שוק',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
