import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/alerts - Get all alerts
 */
export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת ההתראות' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts - Create a new alert
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, name, type, targetPrice, percentChange } = body;

    // Validation
    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'יש לספק סמל נייר' },
        { status: 400 }
      );
    }

    if (!type || !['price_above', 'price_below', 'percent_change', 'pnl_target'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'סוג התראה לא תקין' },
        { status: 400 }
      );
    }

    if ((type === 'price_above' || type === 'price_below') && !targetPrice) {
      return NextResponse.json(
        { success: false, error: 'יש לספק מחיר יעד' },
        { status: 400 }
      );
    }

    if (type === 'percent_change' && !percentChange) {
      return NextResponse.json(
        { success: false, error: 'יש לספק אחוז שינוי' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        symbol: symbol.toUpperCase(),
        name,
        type,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        percentChange: percentChange ? parseFloat(percentChange) : null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה ביצירת התראה' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts - Update an alert (toggle active, update values)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive, targetPrice, percentChange, triggeredAt } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'יש לספק מזהה התראה' },
        { status: 400 }
      );
    }

    const updateData: {
      isActive?: boolean;
      targetPrice?: number;
      percentChange?: number;
      triggeredAt?: Date | null;
    } = {};

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (targetPrice !== undefined) {
      updateData.targetPrice = parseFloat(targetPrice);
    }
    if (percentChange !== undefined) {
      updateData.percentChange = parseFloat(percentChange);
    }
    if (triggeredAt !== undefined) {
      updateData.triggeredAt = triggeredAt ? new Date(triggeredAt) : null;
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון התראה' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts - Delete an alert
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'יש לספק מזהה התראה' },
        { status: 400 }
      );
    }

    await prisma.alert.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ההתראה נמחקה בהצלחה',
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה במחיקת התראה' },
      { status: 500 }
    );
  }
}
