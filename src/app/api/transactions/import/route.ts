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
        totalAmountUSD: true,
        totalAmountILS: true,
      },
    });

    const existingHashes = new Set(
      existingTransactions.map((t) =>
        createTransactionHash({
          date: t.date,
          type: t.type as TransactionInput['type'],
          symbol: t.symbol || undefined,
          name: t.name || undefined,
          rawType: t.rawType || undefined,
          quantity: t.quantity || undefined,
          price: t.price || undefined,
          totalAmountUSD: t.totalAmountUSD || undefined,
          totalAmountILS: t.totalAmountILS || undefined,
          currency: 'USD',
        })
      )
    );

    // Filter out duplicates
    const newTransactions: TransactionInput[] = [];
    let duplicates = 0;
    const duplicateDetails: Array<{ hash: string; transaction: Partial<TransactionInput> }> = [];

    for (const transaction of parseResult.transactions) {
      const hash = createTransactionHash(transaction);
      if (!existingHashes.has(hash)) {
        newTransactions.push(transaction);
        existingHashes.add(hash); // Prevent duplicates within the same import
      } else {
        duplicates++;
        // Log first 10 duplicates for debugging
        if (duplicateDetails.length < 10) {
          duplicateDetails.push({
            hash,
            transaction: {
              date: transaction.date,
              symbol: transaction.symbol,
              name: transaction.name,
              type: transaction.type,
              rawType: transaction.rawType,
              quantity: transaction.quantity,
              price: transaction.price,
            }
          });
        }
      }
    }

    // Log duplicates for debugging
    if (duplicateDetails.length > 0) {
      console.log(`Found ${duplicates} duplicates. First ${duplicateDetails.length} examples:`);
      duplicateDetails.forEach((d, i) => {
        console.log(`Duplicate ${i + 1}: ${d.hash}`, JSON.stringify(d.transaction));
      });
    }

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
