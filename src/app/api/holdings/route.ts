import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncHoldings, getPortfolioStats, calculateCashBalance } from '@/lib/holdings';

// GET - Fetch all holdings with optional recalculation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get('refresh') === 'true';

    // Recalculate holdings only if explicitly requested (e.g. manual refresh)
    if (refresh) {
      await syncHoldings();
    }

    // Fetch holdings and cash balance in parallel
    const [holdings, cashBalance] = await Promise.all([
      prisma.holding.findMany({
        orderBy: { symbol: 'asc' },
      }),
      calculateCashBalance(),
    ]);

    // Get portfolio stats and deposits (reusing fetched holdings)
    const stats = await getPortfolioStats(holdings);

    return NextResponse.json({
      success: true,
      data: {
        holdings,
        cashBalance,
        deposits: stats.deposits,
        stats: {
          totalCost: stats.totalCost,
          totalHoldings: stats.totalHoldings,
          totalCommissions: stats.totalCommissions,
          totalDividends: stats.totalDividends,
          totalDepositsILS: stats.deposits.totalDepositsILS,
          totalWithdrawalsILS: stats.deposits.totalWithdrawalsILS,
          netDepositsILS: stats.deposits.netDepositsILS,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת האחזקות' },
      { status: 500 }
    );
  }
}

// POST - Force recalculate all holdings
export async function POST() {
  try {
    await syncHoldings();

    const holdings = await prisma.holding.findMany({
      orderBy: { symbol: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'האחזקות חושבו מחדש בהצלחה',
      data: { holdings },
    });
  } catch (error) {
    console.error('Error recalculating holdings:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בחישוב האחזקות' },
      { status: 500 }
    );
  }
}
