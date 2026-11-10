import { NextResponse } from 'next/server';
import { deduplicateTransactions, syncHoldings } from '@/lib/holdings';

export async function POST() {
  try {
    const result = await deduplicateTransactions();
    await syncHoldings();

    return NextResponse.json({
      success: true,
      message: `נמחקו ${result.removedCount} תנועות כפולות ועודכנו האחזקות`,
      duplicatesRemoved: result.removedCount,
    });
  } catch (error) {
    console.error('Deduplication failed:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בניקוי כפילויות' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
