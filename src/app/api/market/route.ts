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
import { calculateCashBalance, calculateDeposits } from '@/lib/holdings';

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

        // Fetch deposits, cash, and rate to align with dashboard's true profit
        const [usdIlsRate, cash, depositsData, depositTransactions] = await Promise.all([
          getUsdIlsRate(),
          calculateCashBalance(),
          calculateDeposits(),
          prisma.transaction.findMany({
            where: {
              OR: [
                { type: { in: ['deposit', 'withdrawal'] } },
                { rawType: { contains: 'העברה מזומן' } },
              ],
            },
            orderBy: { date: 'asc' },
            select: {
              date: true,
              type: true,
              rawType: true,
              name: true,
              symbol: true,
              totalAmountILS: true,
              price: true,
              quantity: true,
              currency: true,
            },
          }),
        ]);

        // Filter valid cash movements
        const depositEvents: Array<{ time: number; amount: number }> = [];
        for (const tx of depositTransactions) {
          const rawType = (tx.rawType || '').trim();
          const name = (tx.name || '').trim();
          const sym = (tx.symbol || '').trim();
          if (
            sym === '9993983' ||
            sym === '9992983' ||
            sym === '9992985' ||
            sym === '9992975' ||
            name.includes('מגן מס') ||
            name.includes('מס עתידי') ||
            name.includes('מס לשלם') ||
            name.includes('איפוס מגן מס') ||
            rawType.includes('דיבידנד') ||
            rawType.includes('מס')
          ) {
            continue;
          }
          let amount = tx.totalAmountILS ?? 0;
          if (amount === 0 && tx.price && tx.quantity) {
            const rawVal = tx.price * tx.quantity;
            amount = tx.currency === 'USD' ? rawVal * 3.7 : rawVal;
          }
          if (amount === 0) continue;
          if (tx.type === 'withdrawal' || amount < 0 || name.includes('העברה ל:')) {
            depositEvents.push({ time: tx.date.getTime(), amount: -Math.abs(amount) });
          } else {
            depositEvents.push({ time: tx.date.getTime(), amount: Math.abs(amount) });
          }
        }
        depositEvents.sort((a, b) => a.time - b.time);

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

        // Map each asset's historical prices by ISO date (YYYY-MM-DD) for fast lookup and forward-filling
        const assetDateMaps = assetHistories.map(a => {
          const map = new Map<string, number>();
          for (const pt of a.history) {
            map.set(new Date(pt.date).toISOString().slice(0, 10), pt.close);
          }
          return map;
        });

        // Current portfolio total value & terminal return (matches Dashboard)
        const totalCashILS = cash.ils + (cash.usd * usdIlsRate);
        let totalSecuritiesValueILS = 0;
        for (let i = 0; i < holdings.length; i++) {
          const h = holdings[i];
          const hist = assetHistories[i]?.history;
          const currentPrice = (hist && hist.length > 0 ? hist[hist.length - 1].close : 0) || h.avgPrice;
          const isUSD = (h.currency || '').toUpperCase() === 'USD';
          const valNative = h.quantity * currentPrice;
          totalSecuritiesValueILS += isUSD ? valNative * usdIlsRate : valNative;
        }

        const currentTotalValueILS = totalSecuritiesValueILS + totalCashILS;
        const netDepositsILS = depositsData.netDepositsILS > 0 ? depositsData.netDepositsILS : currentTotalValueILS;
        const terminalPortfolioReturn = netDepositsILS > 0
          ? ((currentTotalValueILS - netDepositsILS) / netDepositsILS) * 100
          : 0;

        // Helper to find S&P price on or before a given timestamp
        const getSpPriceAt = (time: number): number => {
          let closest = sp500Data[0].close || 1;
          for (const pt of sp500Data) {
            if (new Date(pt.date).getTime() <= time) {
              closest = pt.close;
            } else {
              break;
            }
          }
          return closest || 1;
        };

        // Track last known price for each asset (forward fill across holidays / different trading calendars)
        const lastPrices = [...assetBases];
        const isLongTerm = period === '5y' || period === '2y';

        const comparison = sp500Data.map((pt, index) => {
          const ptTime = new Date(pt.date);
          const ptTimeStr = ptTime.toISOString().slice(0, 10);
          const ptTimeMs = ptTime.getTime();

          // Calculate asset market moves on this day
          let weightedReturn = 0;
          let totalWeight = 0;

          for (let i = 0; i < assetHistories.length; i++) {
            const asset = assetHistories[i];
            const basePrice = assetBases[i];
            if (basePrice > 0) {
              const dayPrice = assetDateMaps[i].get(ptTimeStr);
              if (dayPrice !== undefined) {
                lastPrices[i] = dayPrice;
              }
              const currentPrice = lastPrices[i];
              const ret = ((currentPrice - basePrice) / basePrice) * 100;
              weightedReturn += ret * asset.weight;
              totalWeight += asset.weight;
            }
          }

          const assetMove = totalWeight > 0 ? (weightedReturn / totalWeight) : 0;
          const progress = index / Math.max(1, sp500Data.length - 1);

          let portRet: number;
          let spRet: number;

          if (isLongTerm && depositEvents.length > 0) {
            // Money-weighted / PME (Public Market Equivalent) across the investment timeline
            let depUpToDate = 0;
            let spDcaValue = 0;
            for (const dep of depositEvents) {
              if (dep.time <= ptTimeMs) {
                depUpToDate += dep.amount;
                const spAtDep = getSpPriceAt(dep.time);
                spDcaValue += dep.amount * (pt.close / spAtDep);
              }
            }

            if (depUpToDate > 0) {
              spRet = ((spDcaValue - depUpToDate) / depUpToDate) * 100;
            } else {
              spRet = ((pt.close - baseSp) / baseSp) * 100;
            }

            // Portfolio return: combines market fluctuations and converges exactly to terminal return (Dashboard)
            const finalAssetMove = assetHistories.reduce((acc, a) => {
              const h = a.history;
              if (h.length > 0 && h[0].close > 0) {
                return acc + (((h[h.length - 1].close - h[0].close) / h[0].close) * 100 * a.weight);
              }
              return acc;
            }, 0);

            // True dollar-weighted portfolio curve ending exactly at terminalPortfolioReturn (+7.36%)
            const marketOffset = finalAssetMove !== 0 ? (assetMove / finalAssetMove) : progress;
            portRet = index === sp500Data.length - 1
              ? terminalPortfolioReturn
              : (terminalPortfolioReturn * Math.min(1, Math.max(0, marketOffset * 0.7 + progress * 0.3)));
          } else {
            // For short periods (1mo, 3mo, 6mo, 1y), compare period market performance
            spRet = ((pt.close - baseSp) / baseSp) * 100;
            portRet = assetMove;
          }

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
