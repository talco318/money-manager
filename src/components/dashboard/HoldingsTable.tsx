'use client';

import type { HoldingWithMarketData } from '@/types';

interface HoldingsTableProps {
  holdings: HoldingWithMarketData[];
  isLoading?: boolean;
  usdIlsRate?: number;
}

function formatCurrency(value: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function HoldingsTable({ holdings, isLoading, usdIlsRate = 3.7 }: HoldingsTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">אין אחזקות להצגה</p>
        <p className="text-sm">יש לייבא עסקאות כדי לראות את האחזקות שלך</p>
        <a 
          href="/import" 
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ייבוא עסקאות
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">נייר</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סימבול</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">כמות</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">מחיר נוכחי</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">שינוי יומי</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">עלות ממוצעת</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">שווי נוכחי</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">שווי ב-₪</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">רווח/הפסד</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding, index) => {
            const isProfitable = (holding.pnl || 0) >= 0;
            const isDayPositive = (holding.dayChange || 0) >= 0;
            
            return (
              <tr 
                key={holding.id || index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-4 px-4">
                  <a 
                    href={`/stock/${holding.symbol}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {holding.name}
                  </a>
                </td>
                <td className="py-4 px-4">
                  <a 
                    href={`/stock/${holding.symbol}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {holding.symbol}
                  </a>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {formatNumber(holding.quantity, holding.quantity % 1 === 0 ? 0 : 4)}
                </td>
                <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                  {formatCurrency(holding.currentPrice || 0)}
                </td>
                <td className="py-4 px-4">
                  <div className={`flex flex-col ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="font-medium">
                      {isDayPositive ? '+' : ''}{formatCurrency(holding.dayChange || 0)}
                    </span>
                    <span className="text-xs">
                      {formatPercent(holding.dayChangePercent || 0)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {formatCurrency(holding.avgPrice)}
                </td>
                <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                  {formatCurrency(holding.currentValue || 0)}
                </td>
                <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                  {formatNumber((holding.currentValue || 0) * usdIlsRate, 0)} ₪
                </td>
                <td className="py-4 px-4">
                  <div className={`flex flex-col ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="font-medium">
                      {isProfitable ? '+' : ''}{formatCurrency(holding.pnl || 0)}
                    </span>
                    <span className="text-xs">
                      {formatPercent(holding.pnlPercent || 0)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
