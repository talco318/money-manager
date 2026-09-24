import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncHoldings, getPortfolioStats } from '@/lib/holdings';

// GET - Fetch all holdings with optional recalculation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get('refresh') === 'true';

    // Recalculate holdings if requested
    if (refresh) {
      await syncHoldings();
    }

    // Fetch holdings
    const holdings = await prisma.holding.findMany({
      orderBy: { symbol: 'asc' },
    });

    // Get portfolio stats
    const stats = await getPortfolioStats();

    return NextResponse.json({
      success: true,
      data: {
        holdings,
        stats: {
          totalCost: stats.totalCost,
          totalHoldings: stats.totalHoldings,
          totalCommissions: stats.totalCommissions,
          totalDividends: stats.totalDividends,
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
