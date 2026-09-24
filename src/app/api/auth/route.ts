import { NextRequest, NextResponse } from 'next/server';

// Default PIN - can be changed via environment variable
const APP_PIN = process.env.APP_PIN || '1234';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'יש להזין קוד' },
        { status: 400 }
      );
    }

    if (pin === APP_PIN) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'קוד שגוי' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'שגיאה באימות' },
      { status: 500 }
    );
  }
}

// GET - Check if auth is enabled
export async function GET() {
  return NextResponse.json({
    authEnabled: true,
    message: 'Authentication is required',
  });
}
