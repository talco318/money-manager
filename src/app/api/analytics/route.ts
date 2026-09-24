import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface DividendBySymbol {
  symbol: string;
  name: string | null;
  total: number;
  count: number;
}

interface DividendByMonth {
  month: string;
  total: number;
}

interface CommissionByMonth {
  month: string;
  commission: number;
  fees: number;
  total: number;
}

/**
 * GET /api/analytics - Get dividend and commission analytics
 * 
 * Query params:
 * - type: 'dividends' | 'commissions' | 'all'
 * - year: filter by year (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const year = searchParams.get('year');

    const result: {
      dividends?: {
        total: number;
        totalTax: number;
        netTotal: number;
        bySymbol: DividendBySymbol[];
        byMonth: DividendByMonth[];
        transactions: unknown[];
      };
      commissions?: {
        totalCommissions: number;
        totalFees: number;
        grandTotal: number;
        byMonth: CommissionByMonth[];
        avgPerTransaction: number;
        transactionCount: number;
      };
    } = {};

    // Date filter for year
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (year) {
      dateFilter.gte = new Date(`${year}-01-01`);
      dateFilter.lte = new Date(`${year}-12-31T23:59:59`);
    }

    // Dividend Analytics
    if (type === 'dividends' || type === 'all') {
      const dividendTransactions = await prisma.transaction.findMany({
        where: {
          type: 'dividend',
          ...(year && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      });

      // Calculate totals
      let totalDividends = 0;
      let totalTax = 0;
      const symbolMap = new Map<string, { name: string | null; total: number; count: number }>();
      const monthMap = new Map<string, number>();

      for (const tx of dividendTransactions) {
        const amount = Math.abs(tx.totalAmountUSD || 0);
        const tax = tx.taxEstimate || 0;
        
        totalDividends += amount;
        totalTax += Math.abs(tax);

        // By symbol
        const symbol = tx.symbol || 'UNKNOWN';
        const existing = symbolMap.get(symbol);
        if (existing) {
          existing.total += amount;
          existing.count += 1;
        } else {
          symbolMap.set(symbol, { name: tx.name, total: amount, count: 1 });
        }

        // By month
        const monthKey = tx.date.toISOString().slice(0, 7); // YYYY-MM
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);
      }

      const bySymbol: DividendBySymbol[] = Array.from(symbolMap.entries())
        .map(([symbol, data]) => ({ symbol, ...data }))
        .sort((a, b) => b.total - a.total);

      const byMonth: DividendByMonth[] = Array.from(monthMap.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

      result.dividends = {
        total: totalDividends,
        totalTax,
        netTotal: totalDividends - totalTax,
        bySymbol,
        byMonth,
        transactions: dividendTransactions,
      };
    }

    // Commission Analytics
    if (type === 'commissions' || type === 'all') {
      const tradeTransactions = await prisma.transaction.findMany({
        where: {
          type: { in: ['buy', 'sell'] },
          ...(year && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      });

      let totalCommissions = 0;
      let totalFees = 0;
      const monthMap = new Map<string, { commission: number; fees: number }>();

      for (const tx of tradeTransactions) {
        const commission = tx.commission || 0;
        const fees = tx.additionalFees || 0;
        
        totalCommissions += commission;
        totalFees += fees;

        // By month
        const monthKey = tx.date.toISOString().slice(0, 7);
        const existing = monthMap.get(monthKey);
        if (existing) {
          existing.commission += commission;
          existing.fees += fees;
        } else {
          monthMap.set(monthKey, { commission, fees });
        }
      }

      const byMonth: CommissionByMonth[] = Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          commission: data.commission,
          fees: data.fees,
          total: data.commission + data.fees,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const transactionCount = tradeTransactions.length;

      result.commissions = {
        totalCommissions,
        totalFees,
        grandTotal: totalCommissions + totalFees,
        byMonth,
        avgPerTransaction: transactionCount > 0 ? (totalCommissions + totalFees) / transactionCount : 0,
        transactionCount,
      };
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת נתוני אנליטיקה' },
      { status: 500 }
    );
  }
}
