// ============================================
// Transaction Types
// ============================================

export type TransactionType = 
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'tax'
  | 'deposit'
  | 'withdrawal'
  | 'fee'
  | 'currency_exchange';

export interface TransactionInput {
  date: Date;
  type: TransactionType;
  symbol?: string;
  name?: string;
  quantity?: number;
  price?: number;
  currency: 'USD' | 'ILS';
  commission?: number;
  additionalFees?: number;
  totalAmountUSD?: number;
  totalAmountILS?: number;
  cashBalance?: number;
  taxEstimate?: number;
  broker?: string;
  rawType?: string;
}

// ============================================
// Holding Types
// ============================================

export interface HoldingWithMarketData {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currency: string;
  totalCost: number;
  currentPrice?: number;
  currentValue?: number;
  pnl?: number;
  pnlPercent?: number;
  dayChange?: number;
  dayChangePercent?: number;
}

// ============================================
// Market Data Types
// ============================================

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

// ============================================
// Portfolio Types
// ============================================

export interface PortfolioSummary {
  totalValue: number;
  totalValueILS: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cashBalance: number;
  cashBalanceILS: number;
  holdings: HoldingWithMarketData[];
}

export interface PortfolioPerformance {
  date: Date;
  totalValue: number;
  sp500Value: number;
  portfolioReturn: number;
  sp500Return: number;
}

// ============================================
// Alert Types
// ============================================

export type AlertType = 'price_above' | 'price_below' | 'percent_change' | 'pnl_target';

export interface AlertInput {
  symbol: string;
  name?: string;
  type: AlertType;
  targetPrice?: number;
  percentChange?: number;
}

// ============================================
// Import Types
// ============================================

export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: string[];
  transactions: TransactionInput[];
}

export interface MeitavExcelRow {
  'תאריך': string;
  'סוג פעולה': string;
  'שם נייר': string;
  'מס\' נייר / סימבול': string;
  'כמות': number;
  'שער ביצוע': number;
  'מטבע': string;
  'עמלת פעולה': number;
  'עמלות נלוות': number;
  'תמורה במט"ח': number;
  'תמורה בשקלים': number;
  'יתרה שקלית': number;
  'אומדן מס רווחי הון': number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Chart Types
// ============================================

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ComparisonChartData {
  date: string;
  portfolio: number;
  sp500: number;
}

export interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color?: string;
}
