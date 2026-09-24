import * as XLSX from 'xlsx';
import { TransactionInput, TransactionType, ImportResult } from '@/types';

// Meitav Excel column names in Hebrew
const COLUMN_MAPPING: Record<string, string> = {
  'תאריך': 'date',
  'סוג פעולה': 'rawType',
  'שם נייר': 'name',
  "מס' נייר / סימבול": 'symbol',
  "מס' נייר": 'symbol',
  'סימבול': 'symbol',
  'מספר נייר': 'symbol',
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
  'קניה רצף': 'buy',
  'מכירה חול מטח': 'sell',
  'מכירה שח': 'sell',
  'מכירה רצף': 'sell',
  'הפקדה דיבידנד מטח': 'dividend',
  'הפקדה דיבידנד': 'dividend',
  'משיכת מס חול מטח': 'tax',
  'משיכת מס': 'tax',
  'הפקדה': 'deposit',
  'משיכה': 'withdrawal',
  'דמי טפול מזומן בשח': 'fee',
  'דמי טיפול': 'fee',
};

// Known ETF mappings (Israeli trading numbers to Yahoo Finance symbols)
const ETF_SYMBOL_MAPPING: Record<string, string> = {
  // iShares ETFs traded in Israel (international)
  '1159235': 'ACWI',    // iShares MSCI ACWI
  '1159169': 'EEM',     // iShares MSCI Emerging Markets
  '1159236': 'VOO',     // Vanguard S&P 500
  '1159237': 'IVV',     // iShares Core S&P 500
  '1145015': 'QQQ',     // Invesco QQQ (Nasdaq)
  '1146291': 'TLT',     // iShares 20+ Year Treasury Bond
  '1146292': 'BND',     // Vanguard Total Bond Market
  '1147001': 'VEA',     // Vanguard FTSE Developed Markets
  '1147002': 'EFA',     // iShares MSCI EAFE
  '1159100': 'SPY',     // SPDR S&P 500
  '1159101': 'VTI',     // Vanguard Total Stock Market
  '1159102': 'AGG',     // iShares Core US Aggregate Bond
  '1159103': 'VWO',     // Vanguard FTSE Emerging Markets
  '1159104': 'VNQ',     // Vanguard Real Estate
  '1159105': 'GLD',     // SPDR Gold Shares
  // Israeli stocks/ETFs - add .TA suffix for Yahoo Finance
  // Format: Israeli security number -> Yahoo symbol with .TA
};

// Hebrew name to symbol mapping (fallback)
const ETF_NAME_MAPPING: Record<string, string> = {
  'איישרס.חmsciacw': 'ACWI',
  'איישרס.חmsci acw': 'ACWI',
  'איישרס.חmsci em': 'EEM',
  'איישרס.חמסצי אי.אם': 'EEM',
  'ואנגארד ס.פ 500': 'VOO',
  'ואנגארד ס&פ 500': 'VOO',
  'spdr s&p 500': 'SPY',
  'invesco qqq': 'QQQ',
};

// Israeli security numbers to TASE symbols (Yahoo uses .TA suffix)
// These can be looked up at: https://www.tase.co.il/
const ISRAELI_SECURITY_MAPPING: Record<string, string> = {
  // Add Israeli securities here as: 'securityNumber': 'SYMBOL.TA'
  // Example: '1082128': 'TEVA.TA',
};

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
 * Clean symbol - remove extra characters and map ETFs
 */
function cleanSymbol(symbol: string | undefined, name?: string): string | undefined {
  if (!symbol && !name) return undefined;
  
  const str = String(symbol || '').trim();
  
  // Skip empty symbols
  if (!str) return undefined;
  
  // Check if it's a known international ETF by Israeli trading number
  if (ETF_SYMBOL_MAPPING[str]) {
    return ETF_SYMBOL_MAPPING[str];
  }
  
  // Check if it's a known Israeli security
  if (ISRAELI_SECURITY_MAPPING[str]) {
    return ISRAELI_SECURITY_MAPPING[str];
  }
  
  // Try to match by Hebrew name
  if (name) {
    const normalizedName = String(name).toLowerCase().trim();
    for (const [hebrewName, yahooSymbol] of Object.entries(ETF_NAME_MAPPING)) {
      if (normalizedName.includes(hebrewName) || hebrewName.includes(normalizedName)) {
        return yahooSymbol;
      }
    }
  }
  
  // If it's a pure number (Israeli security number)
  if (/^\d+$/.test(str)) {
    // Keep as-is - it's an Israeli security we haven't mapped
    // It will be stored and can be manually mapped later
    if (str.length >= 5 && str.length <= 8) {
      console.log(`Unmapped Israeli security: ${str}, name: ${name}`);
      return str; // Keep the number as symbol
    }
    return undefined;
  }
  
  // Clean up common symbol formats
  let cleaned = str.toUpperCase();
  
  // Remove common suffixes that Yahoo Finance doesn't use
  cleaned = cleaned.replace(/\.US$/, '');
  cleaned = cleaned.replace(/\.NYSE$/, '');
  cleaned = cleaned.replace(/\.NASDAQ$/, '');
  cleaned = cleaned.replace(/\s+/g, '');
  
  return cleaned;
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
  const name = String(row.name || '').trim();
  const symbol = cleanSymbol(row.symbol as string, name);
  
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
  const rawName = String(row.name || '').trim();
  const symbol = cleanSymbol(row.symbol as string, rawName);
  const currency = parseCurrency(row.currency as string);
  
  // For fee transactions, use the raw name; otherwise use cleaned name or symbol
  const name = type === 'fee' 
    ? rawName || 'דמי טיפול'
    : rawName || symbol || undefined;
  
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
  // Log the first row's column names for debugging
  if (rows.length > 0) {
    console.log('Excel column names found:', Object.keys(rows[0]));
  }
  
  return rows.map((row, index) => {
    const transformed: Record<string, unknown> = {};
    
    for (const [hebrewKey, englishKey] of Object.entries(COLUMN_MAPPING)) {
      if (row[hebrewKey] !== undefined) {
        transformed[englishKey] = row[hebrewKey];
      }
    }
    
    // Log first few rows for debugging
    if (index < 3) {
      console.log(`Row ${index}:`, { 
        rawSymbol: row["מס' נייר / סימבול"] || row["מס' נייר"] || row["סימבול"],
        rawName: row["שם נייר"],
        transformedSymbol: transformed.symbol,
        transformedName: transformed.name
      });
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
