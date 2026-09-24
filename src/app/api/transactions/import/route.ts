import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, createTransactionHash } from '@/lib/excel';
import prisma from '@/lib/prisma';
import { syncHoldings } from '@/lib/holdings';
import { TransactionInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get the file from the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'לא נבחר קובץ' },
        { status: 400 }
      );
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'יש להעלות קובץ Excel (.xlsx או .xls)' },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Parse the Excel file
    const parseResult = parseExcelFile(buffer);

    if (!parseResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'שגיאה בקריאת הקובץ',
          errors: parseResult.errors 
        },
        { status: 400 }
      );
    }

    // Get existing transaction hashes for duplicate detection
    // Must include all fields used by createTransactionHash
    const existingTransactions = await prisma.transaction.findMany({
      select: {
        date: true,
        symbol: true,
        name: true,
        type: true,
        rawType: true,
        quantity: true,
        price: true,
        currency: true,
        totalAmountUSD: true,
        totalAmountILS: true,
      },
    });

    // Count occurrences of each hash in existing transactions
    const existingHashCounts = new Map<string, number>();
    existingTransactions.forEach((t) => {
      const hash = createTransactionHash({
        date: t.date,
        type: t.type as TransactionInput['type'],
        symbol: t.symbol || undefined,
        name: t.name || undefined,
        rawType: t.rawType || undefined,
        quantity: t.quantity || undefined,
        price: t.price || undefined,
        totalAmountUSD: t.totalAmountUSD || undefined,
        totalAmountILS: t.totalAmountILS || undefined,
        currency: (t.currency as 'USD' | 'ILS') || 'USD',
      });
      existingHashCounts.set(hash, (existingHashCounts.get(hash) || 0) + 1);
    });

    // Process import - allow identical transactions within same file
    // Only skip if that exact count already exists in DB
    const newTransactions: TransactionInput[] = [];
    let duplicates = 0;
    const importHashCounts = new Map<string, number>();

    for (const transaction of parseResult.transactions) {
      const hash = createTransactionHash(transaction);
      const existingCount = existingHashCounts.get(hash) || 0;
      const importedSoFar = importHashCounts.get(hash) || 0;
      
      // Import if: we haven't yet reached the number that already exists in DB
      // Example: DB has 2 identical transactions, file has 3 -> import 1 more
      // Example: DB has 0, file has 2 identical -> import both
      // Example: DB has 2, file has 2 identical -> skip both (already imported)
      if (importedSoFar < existingCount) {
        // This occurrence matches one in DB, skip it
        duplicates++;
      } else {
        // This is a new occurrence, import it
        newTransactions.push(transaction);
      }
      
      importHashCounts.set(hash, importedSoFar + 1);
    }

    console.log(`Import: ${parseResult.transactions.length} parsed, ${newTransactions.length} new, ${duplicates} duplicates`);

    // Insert new transactions
    if (newTransactions.length > 0) {
      await prisma.transaction.createMany({
        data: newTransactions.map((t) => ({
          date: t.date,
          type: t.type,
          symbol: t.symbol || null,
          name: t.name || null,
          quantity: t.quantity || null,
          price: t.price || null,
          currency: t.currency,
          commission: t.commission || 0,
          additionalFees: t.additionalFees || 0,
          totalAmountUSD: t.totalAmountUSD || null,
          totalAmountILS: t.totalAmountILS || null,
          cashBalance: t.cashBalance || null,
          taxEstimate: t.taxEstimate || null,
          broker: t.broker || 'Meitav',
          rawType: t.rawType || null,
        })),
      });

      // Recalculate holdings after import
      await syncHoldings();
    }

    // Return import summary
    return NextResponse.json({
      success: true,
      summary: {
        totalRows: parseResult.totalRows,
        parsed: parseResult.imported,
        imported: newTransactions.length,
        duplicates,
        skipped: parseResult.skipped,
        errors: parseResult.errors,
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'שגיאה בייבוא העסקאות' 
      },
      { status: 500 }
    );
  }
}
