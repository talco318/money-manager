import * as XLSX from 'xlsx';
import { TransactionInput, TransactionType, ImportResult } from '@/types';

// Meitav Excel column names in Hebrew
const COLUMN_MAPPING: Record<string, string> = {
  'תאריך': 'date',
  'סוג פעולה': 'rawType',
  'שם נייר': 'name',
  "מס' נייר / סימבול": 'symbol',
  'כמות': 'quantity',
  'שער ביצוע': 'price',
  'מטבע': 'currency',
  'עמלת פעולה': 'commission',
  'עמלות נלוות': 'additionalFees',
  'תמורה במט"ח': 'totalAmountUSD',
  'תמורה בשקלים': 'totalAmountILS',
  'יתרה שקלית': 'cashBalance',
  'אומדן מס רווחי הון': 'taxEstimate',
};

// Transaction type mapping from Hebrew
const TRANSACTION_TYPE_MAPPING: Record<string, TransactionType> = {
  'קניה חול מטח': 'buy',
  'קניה שח': 'buy',
  'מכירה חול מטח': 'sell',
  'מכירה שח': 'sell',
  'הפקדה דיבידנד מטח': 'dividend',
  'הפקדה דיבידנד': 'dividend',
  'משיכת מס חול מטח': 'tax',
  'משיכת מס': 'tax',
  'הפקדה': 'deposit',
  'משיכה': 'withdrawal',
  'דמי טפול מזומן בשח': 'fee',
  'דמי טיפול': 'fee',
};

// Symbols to ignore (internal Meitav codes)
const IGNORED_SYMBOLS = ['9992983', '9992985', '9993983', '900', '99028'];

/**
 * Parse date from DD/MM/YYYY format
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Handle Excel serial date numbers
  if (typeof dateStr === 'number') {
    const date = XLSX.SSF.parse_date_code(dateStr);
    return new Date(date.y, date.m - 1, date.d);
  }
  
  // Handle string date DD/MM/YYYY
  const parts = String(dateStr).split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}

/**
 * Parse currency symbol
 */
function parseCurrency(currencyStr: string): 'USD' | 'ILS' {
  if (!currencyStr) return 'USD';
  const str = String(currencyStr).trim();
  if (str.includes('₪') || str.includes('שח') || str.toLowerCase() === 'ils') {
    return 'ILS';
  }
  return 'USD';
}

/**
 * Clean symbol - remove extra characters
 */
function cleanSymbol(symbol: string | undefined): string | undefined {
  if (!symbol) return undefined;
  
  const str = String(symbol).trim();
  
  // Skip internal Meitav codes
  if (IGNORED_SYMBOLS.includes(str)) return undefined;
  
  // If it's a number only, it might be an internal code
  if (/^\d+$/.test(str)) return undefined;
  
  return str.toUpperCase();
}

/**
 * Map Hebrew transaction type to internal type
 */
function mapTransactionType(hebrewType: string): TransactionType {
  const normalized = String(hebrewType).trim();
  
  // Try exact match first
  if (TRANSACTION_TYPE_MAPPING[normalized]) {
    return TRANSACTION_TYPE_MAPPING[normalized];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(TRANSACTION_TYPE_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Default to deposit for unknown types
  return 'deposit';
}

/**
 * Check if transaction should be imported (filter out internal transactions)
 */
function shouldImportTransaction(row: Record<string, unknown>): boolean {
  const rawType = String(row.rawType || '').trim();
  const symbol = cleanSymbol(row.symbol as string);
  
  // Skip transactions without meaningful data
  if (!rawType) return false;
  
  // Skip internal account operations (unless they have real symbols)
  if (rawType.includes('מגן מס') || rawType.includes('מס עתידי') || rawType.includes('מס לשלם')) {
    return false;
  }
  
  // Skip if no symbol and it's a buy/sell
  const type = mapTransactionType(rawType);
  if ((type === 'buy' || type === 'sell') && !symbol) {
    return false;
  }
  
  return true;
}

/**
 * Parse a single row from Meitav Excel
 */
function parseRow(row: Record<string, unknown>): TransactionInput | null {
  if (!shouldImportTransaction(row)) {
    return null;
  }
  
  const date = parseDate(row.date as string);
  if (!date) return null;
  
  const rawType = String(row.rawType || '').trim();
  const type = mapTransactionType(rawType);
  const symbol = cleanSymbol(row.symbol as string);
  const currency = parseCurrency(row.currency as string);
  
  // For fee transactions, use the raw name
  const name = type === 'fee' 
    ? String(row.name || 'דמי טיפול').trim()
    : String(row.name || '').trim() || undefined;
  
  return {
    date,
    type,
    symbol,
    name,
    quantity: row.quantity ? Math.abs(Number(row.quantity)) : undefined,
    price: row.price ? Math.abs(Number(row.price)) : undefined,
    currency,
    commission: row.commission ? Math.abs(Number(row.commission)) : 0,
    additionalFees: row.additionalFees ? Math.abs(Number(row.additionalFees)) : 0,
    totalAmountUSD: row.totalAmountUSD ? Number(row.totalAmountUSD) : undefined,
    totalAmountILS: row.totalAmountILS ? Number(row.totalAmountILS) : undefined,
    cashBalance: row.cashBalance ? Number(row.cashBalance) : undefined,
    taxEstimate: row.taxEstimate ? Number(row.taxEstimate) : undefined,
    broker: 'Meitav',
    rawType,
  };
}

/**
 * Transform raw Excel data to use English column names
 */
function transformColumns(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const transformed: Record<string, unknown> = {};
    
    for (const [hebrewKey, englishKey] of Object.entries(COLUMN_MAPPING)) {
      if (row[hebrewKey] !== undefined) {
        transformed[englishKey] = row[hebrewKey];
      }
    }
    
    return transformed;
  });
}

/**
 * Parse Excel file buffer and return transactions
 */
export function parseExcelFile(buffer: ArrayBuffer): ImportResult {
  const result: ImportResult = {
    success: true,
    totalRows: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    transactions: [],
  };

  try {
    // Read the workbook
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    result.totalRows = rawRows.length;
    
    // Transform column names
    const rows = transformColumns(rawRows);
    
    // Parse each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const transaction = parseRow(rows[i]);
        
        if (transaction) {
          result.transactions.push(transaction);
          result.imported++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`שורה ${i + 2}: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
        result.skipped++;
      }
    }
    
  } catch (error) {
    result.success = false;
    result.errors.push(`שגיאה בקריאת הקובץ: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
  }

  return result;
}

/**
 * Create a unique hash for duplicate detection
 */
export function createTransactionHash(transaction: TransactionInput): string {
  const dateStr = transaction.date.toISOString().split('T')[0];
  const symbol = transaction.symbol || 'N/A';
  const quantity = transaction.quantity?.toFixed(4) || '0';
  const price = transaction.price?.toFixed(4) || '0';
  const type = transaction.type;
  
  return `${dateStr}_${symbol}_${type}_${quantity}_${price}`;
}
