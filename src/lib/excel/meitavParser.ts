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
  // Buy transactions
  'קניה חול מטח': 'buy',
  'קניה שח': 'buy',
  'קניה רצף': 'buy',
  'קניה מעוף': 'buy',
  'קניה מס (( ניעז)': 'buy',  // Tax-related purchase
  'קניה מס': 'buy',
  
  // Sell transactions
  'מכירה חול מטח': 'sell',
  'מכירה שח': 'sell',
  'מכירה רצף': 'sell',
  'מכירה מעוף': 'sell',
  
  // Dividends
  'הפקדה דיבידנד מטח': 'dividend',
  'הפקדה דיבידנד': 'dividend',
  'דיבדנד': 'dividend',
  'דיבידנד בעין': 'stock_dividend',  // Dividend paid in shares
  
  // Tax
  'משיכת מס חול מטח': 'tax',
  'משיכת מס': 'tax',
  
  // Deposits/Withdrawals
  'הפקדה': 'deposit',
  'משיכה': 'withdrawal',
  'העברה מזומן בשח': 'deposit',
  
  // Fees
  'דמי טפול מזומן בשח': 'fee',
  'דמי טיפול': 'fee',
  'עמלה מזומן בשח': 'fee',
  
  // Stock splits / bonus shares - ADD shares at $0 cost
  'הטבה': 'split',  // This is the main one - bonus shares / stock split
  'פיצול מניות': 'split',
  'פיצול': 'split',
  'הקצאת זכויות': 'split',
  'הקצאה': 'split',
  'מניות הטבה': 'split',
  'בונוס': 'split',
  
  // Capital reduction - REMOVE shares
  'הפחתת הון': 'capital_reduction',
  
  // Interest
  'ריבית בניע': 'interest',
  'ריבית מזומן בשח': 'interest',
};

// Known ETF mappings (Only for actual ticker renames, never map Israeli funds to US tickers)
const ETF_SYMBOL_MAPPING: Record<string, string> = {
  // Cash/Currency
  '99028': 'USD',       // דולר ארה"ב (USD cash position)
};

// Hebrew name to symbol mapping (fallback - only for actual US stocks/ETFs)
const ETF_NAME_MAPPING: Record<string, string> = {
};

// Israeli security numbers to TASE symbols (optional manual overrides if needed)
const ISRAELI_SECURITY_MAPPING: Record<string, string> = {
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
 * Parse currency symbol and check if price is in Agorot
 */
function parseCurrency(currencyStr: string): { currency: 'USD' | 'ILS', isAgorot: boolean } {
  if (!currencyStr) return { currency: 'USD', isAgorot: false };
  const str = String(currencyStr).trim().toLowerCase();
  
  // Check for ILS/Shekel indicators
  if (str.includes('₪') || str.includes('שח') || str === 'ils' || str.includes('שקל')) {
    return { currency: 'ILS', isAgorot: false };
  }
  
  // Check for Agorot (Israeli cents)
  if (str.includes('אגורות') || str.includes('אג') || str === 'agr' || str === 'agorot') {
    return { currency: 'ILS', isAgorot: true };
  }
  
  return { currency: 'USD', isAgorot: false };
}

/**
 * Check if a transaction type indicates Israeli market (TASE)
 * Israeli transactions have prices in Agorot
 */
function isIsraeliTransactionType(rawType: string): boolean {
  const type = String(rawType).trim().toLowerCase();
  // "רצף" = Israeli continuous trading
  // "שח" = Shekel transactions
  // NOT "חול" (foreign) or "מטח" (foreign currency)
  if (type.includes('רצף') || type.includes('שח')) {
    if (!type.includes('חול') && !type.includes('מטח')) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a security price is in Agorot and needs conversion to ILS
 * 
 * Key insight: Securities traded on TASE (Israeli exchange) are priced in AGOROT,
 * even if they're international ETFs like ACWI or EEM.
 * 
 * Detection methods:
 * 1. Transaction type contains "רצף" (Israeli continuous trading)
 * 2. Currency is ILS/₪ and price > 100 (Agorot prices are typically 1000-50000)
 * 3. Symbol is a 6-7 digit Israeli security number
 */
function isIsraeliSecurityInAgorot(
  symbol: string | undefined, 
  price: number | undefined, 
  currencyStr: string,
  rawType?: string
): boolean {
  // If currency explicitly indicates Agorot
  if (currencyStr && (currencyStr.includes('אג') || currencyStr.toLowerCase().includes('agr'))) {
    console.log(`Agorot detected by currency string: ${symbol}`);
    return true;
  }
  
  // If transaction type indicates Israeli market
  if (rawType && isIsraeliTransactionType(rawType)) {
    console.log(`Agorot detected by transaction type "${rawType}": ${symbol}`);
    return true;
  }
  
  if (!symbol) return false;
  const str = String(symbol).trim();
  
  // Check if currency is ILS (שח or ₪)
  const isILS = currencyStr && (
    currencyStr.includes('₪') || 
    currencyStr.includes('שח') || 
    currencyStr.toLowerCase().includes('ils') ||
    currencyStr.toLowerCase().includes('שקל')
  );
  
  // If it's NOT ILS, it's probably USD - no conversion needed
  if (!isILS) {
    return false;
  }
  
  // If ILS and price is very high (over 100), it's almost certainly Agorot
  // Real stock prices in ILS would rarely exceed 100 ILS per share
  // But Agorot prices are commonly 10000-50000 (100-500 ILS)
  if (price && price > 100) {
    console.log(`Agorot detected by high ILS price: ${str} at ${price} (likely ${price / 100} ILS)`);
    return true;
  }
  
  // Israeli security numbers are typically 6-7 digits
  // These are ALWAYS traded in Agorot on TASE
  if (/^\d{6,7}$/.test(str)) {
    console.log(`Agorot detected by Israeli security number: ${str}`);
    return true;
  }
  
  return false;
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

function isCurrencyExchangeRow(rawType: string, name: string, rawSymbol: string): boolean {
  if (rawType.includes('דיבידנד') || rawType.includes('מס')) {
    return false;
  }
  return (
    rawSymbol === '99028' ||
    name.includes('USD/ILS') ||
    name.startsWith('B USD/ILS') ||
    name.startsWith('S USD/ILS') ||
    rawType.includes('USD/ILS') ||
    rawType.includes('המרה')
  );
}

/**
 * Check if transaction should be imported (filter out internal transactions)
 */
function shouldImportTransaction(row: Record<string, unknown>): boolean {
  const rawType = String(row.rawType || '').trim();
  const name = String(row.name || '').trim();
  const rawSymbol = String(row.symbol || '').trim();
  
  // Skip transactions without meaningful data
  if (!rawType) return false;

  // Currency exchange transactions (B USD/ILS, 99028)
  if (isCurrencyExchangeRow(rawType, name, rawSymbol)) {
    return true;
  }

  // Skip internal tax operations (tax shield, future tax, etc.)
  if (rawType.includes('מגן מס') || rawType.includes('מס עתידי') || rawType.includes('מס לשלם') || 
      rawType.includes('מס ששולם') || rawType.includes('מס תקבולים') || rawType.includes('זיכוי מס') || 
      rawType.includes('איפוס מגן מס') || rawSymbol === '9993983' || rawSymbol === '9992983' ||
      name.includes('מגן מס') || name.includes('מס ששולם')) {
    return false;
  }

  // Skip bank deposit interest (פח"ק בבנק)
  if (name.includes('פח"ק בבנק') || name.includes('פחק בבנק')) {
    return false;
  }

  // Real cash movements (deposits, fees, interest)
  if (rawType.includes('העברה מזומן') || rawType.includes('משיכת מזומן') || 
      rawType.includes('דמי טיפול') || rawType.includes('דמי טפול') || 
      rawType.includes('ריבית מזומן') || rawType === 'הפקדה' || rawType === 'משיכה') {
    return true;
  }

  const symbol = cleanSymbol(rawSymbol, name);
  const type = mapTransactionType(rawType);
  
  // Always import splits, capital reductions, and stock dividends if they have a symbol
  if ((type === 'split' || type === 'capital_reduction' || type === 'stock_dividend') && symbol) {
    return true;
  }
  
  // Skip if no symbol and it's a buy/sell
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
  const rawName = String(row.name || '').trim();
  const rawSymbol = String(row.symbol || '').trim();

  // Handle currency exchange explicitly
  if (isCurrencyExchangeRow(rawType, rawName, rawSymbol)) {
    const qty = row.quantity ? Math.abs(Number(row.quantity)) : 0;
    let price = row.price ? Math.abs(Number(row.price)) : undefined;
    if (price && price > 100) {
      price = price / 100;
    }
    const isBuyUSD = rawType.includes('קניה') || rawName.startsWith('B USD/ILS');
    const isSellUSD = rawType.includes('מכירה') || rawName.startsWith('S USD/ILS');
    const totalAmountUSD = isBuyUSD ? qty : (isSellUSD ? -qty : (row.totalAmountUSD ? Number(row.totalAmountUSD) : 0));

    return {
      date,
      type: 'currency_exchange',
      symbol: 'USD',
      name: rawName || 'המרת מט"ח דולר/שקל',
      quantity: qty,
      price,
      currency: 'USD',
      commission: row.commission ? Math.abs(Number(row.commission)) : 0,
      additionalFees: row.additionalFees ? Math.abs(Number(row.additionalFees)) : 0,
      totalAmountUSD,
      totalAmountILS: row.totalAmountILS ? Number(row.totalAmountILS) : undefined,
      cashBalance: row.cashBalance ? Number(row.cashBalance) : undefined,
      taxEstimate: row.taxEstimate ? Number(row.taxEstimate) : undefined,
      broker: 'Meitav',
      rawType,
    };
  }

  const type = mapTransactionType(rawType);
  const symbol = cleanSymbol(rawSymbol, rawName);
  
  const currencyStr = String(row.currency || '').trim();
  const { currency, isAgorot } = parseCurrency(currencyStr);
  
  // Parse raw price first
  let price = row.price ? Math.abs(Number(row.price)) : undefined;
  
  // Check if this is an Israeli security with price in Agorot
  const needsAgorotConversion = isAgorot || isIsraeliSecurityInAgorot(rawSymbol, price, currencyStr, rawType);
  
  // Convert from Agorot to Shekels if needed
  if (price && needsAgorotConversion) {
    console.log(`Converting Agorot to ILS: ${rawSymbol} (${rawType}) ${price} -> ${price / 100}`);
    price = price / 100;
  }
  
  // Determine true currency: Israeli securities/transactions are in ILS, foreign are in USD
  const isIsraeli = isIsraeliTransactionType(rawType) || /^\d{6,7}$/.test(rawSymbol) || currency === 'ILS';
  const finalCurrency: 'USD' | 'ILS' = isIsraeli ? 'ILS' : 'USD';
  
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
    price,
    currency: finalCurrency,
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
    
    // Parse each row in chronological order (Meitav exports newest at top, so reverse to process oldest first)
    for (let i = rows.length - 1; i >= 0; i--) {
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
 * Includes more fields for better uniqueness
 */
export function createTransactionHash(transaction: TransactionInput): string {
  const dateStr = transaction.date.toISOString().split('T')[0];
  const symbol = transaction.symbol || 'N/A';
  const name = transaction.name || 'N/A';
  const quantity = transaction.quantity?.toFixed(4) || '0';
  const price = transaction.price?.toFixed(4) || '0';
  const type = transaction.type;
  const rawType = transaction.rawType || '';
  const currency = transaction.currency || 'USD';
  const totalUSD = transaction.totalAmountUSD?.toFixed(2) || '0';
  const totalILS = transaction.totalAmountILS?.toFixed(2) || '0';
  
  // Include more fields for better uniqueness
  return `${dateStr}_${symbol}_${name}_${type}_${rawType}_${currency}_${quantity}_${price}_${totalUSD}_${totalILS}`;
}
