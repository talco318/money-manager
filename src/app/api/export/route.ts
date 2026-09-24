import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/export - Export all data as JSON
 */
export async function GET() {
  try {
    const [transactions, holdings, alerts, dividends, settings] = await Promise.all([
      prisma.transaction.findMany({ orderBy: { date: 'desc' } }),
      prisma.holding.findMany(),
      prisma.alert.findMany(),
      prisma.dividend.findMany({ orderBy: { date: 'desc' } }),
      prisma.settings.findUnique({ where: { id: 'default' } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        transactions,
        holdings,
        alerts,
        dividends,
        settings,
      },
      stats: {
        transactionCount: transactions.length,
        holdingCount: holdings.length,
        alertCount: alerts.length,
        dividendCount: dividends.length,
      },
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="portfolio-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בייצוא הנתונים' },
      { status: 500 }
    );
  }
}
