import { NextResponse } from 'next/server';
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
