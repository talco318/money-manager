import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/settings - Get current settings
 */
export async function GET() {
  try {
    // Get or create default settings
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          defaultBroker: 'Meitav',
          currencyDisplay: 'USD',
          refreshInterval: 15,
          notificationsEnabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת ההגדרות' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings - Update settings
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { defaultBroker, currencyDisplay, refreshInterval, notificationsEnabled } = body;

    const updateData: {
      defaultBroker?: string;
      currencyDisplay?: string;
      refreshInterval?: number;
      notificationsEnabled?: boolean;
    } = {};

    if (defaultBroker !== undefined) {
      updateData.defaultBroker = defaultBroker;
    }
    if (currencyDisplay !== undefined) {
      updateData.currencyDisplay = currencyDisplay;
    }
    if (refreshInterval !== undefined) {
      updateData.refreshInterval = parseInt(refreshInterval);
    }
    if (notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = notificationsEnabled;
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        defaultBroker: defaultBroker || 'Meitav',
        currencyDisplay: currencyDisplay || 'USD',
        refreshInterval: refreshInterval || 15,
        notificationsEnabled: notificationsEnabled ?? true,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון ההגדרות' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/data - Delete all data (dangerous!)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'DELETE_ALL_DATA') {
      return NextResponse.json(
        { success: false, error: 'יש לאשר את המחיקה' },
        { status: 400 }
      );
    }

    // Delete all data in order (respecting foreign keys if any)
    await prisma.alert.deleteMany();
    await prisma.dividend.deleteMany();
    await prisma.portfolioSnapshot.deleteMany();
    await prisma.holding.deleteMany();
    await prisma.transaction.deleteMany();

    return NextResponse.json({
      success: true,
      message: 'כל הנתונים נמחקו בהצלחה',
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה במחיקת הנתונים' },
      { status: 500 }
    );
  }
}
