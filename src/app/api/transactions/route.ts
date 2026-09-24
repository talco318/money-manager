import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncHoldings } from '@/lib/holdings';

// GET - Fetch transactions with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (symbol) {
      where.symbol = { equals: symbol.toUpperCase(), mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { symbol: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // For symbol-specific requests, return simpler response
    if (symbol) {
      return NextResponse.json({
        success: true,
        data: transactions,
      });
    }

    // Get unique symbols for filter dropdown
    const symbols = await prisma.transaction.findMany({
      where: { symbol: { not: null } },
      select: { symbol: true },
      distinct: ['symbol'],
      orderBy: { symbol: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          symbols: symbols.map((s) => s.symbol).filter(Boolean),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת העסקאות' },
      { status: 500 }
    );
  }
}

// POST - Create a new transaction manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.date || !body.type) {
      return NextResponse.json(
        { success: false, error: 'חסרים שדות חובה (תאריך וסוג עסקה)' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['buy', 'sell', 'dividend', 'tax', 'deposit', 'withdrawal', 'fee', 'currency_exchange'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'סוג עסקה לא תקין' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(body.date),
        type: body.type,
        symbol: body.symbol || null,
        name: body.name || null,
        quantity: body.quantity ? parseFloat(body.quantity) : null,
        price: body.price ? parseFloat(body.price) : null,
        currency: body.currency || 'USD',
        commission: body.commission ? parseFloat(body.commission) : 0,
        additionalFees: body.additionalFees ? parseFloat(body.additionalFees) : 0,
        totalAmountUSD: body.totalAmountUSD ? parseFloat(body.totalAmountUSD) : null,
        totalAmountILS: body.totalAmountILS ? parseFloat(body.totalAmountILS) : null,
        broker: body.broker || 'Meitav',
        rawType: body.rawType || null,
      },
    });

    // Recalculate holdings if it's a buy/sell transaction
    if (body.type === 'buy' || body.type === 'sell') {
      await syncHoldings();
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה ביצירת העסקה' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a transaction
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'חסר מזהה עסקה' },
        { status: 400 }
      );
    }

    // Get the transaction to check its type
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { type: true },
    });

    await prisma.transaction.delete({
      where: { id },
    });

    // Recalculate holdings if it was a buy/sell transaction
    if (transaction && (transaction.type === 'buy' || transaction.type === 'sell')) {
      await syncHoldings();
    }

    return NextResponse.json({
      success: true,
      message: 'העסקה נמחקה בהצלחה',
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה במחיקת העסקה' },
      { status: 500 }
    );
  }
}
