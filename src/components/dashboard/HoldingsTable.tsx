'use client';

import type { HoldingWithMarketData } from '@/types';

interface HoldingsTableProps {
  holdings: HoldingWithMarketData[];
  isLoading?: boolean;
  usdIlsRate?: number;
  cashBalances?: {
    ils: number;
    usd: number;
    totalILS: number;
  };
}

function formatCurrency(value: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat(currency === 'ILS' ? 'he-IL' : 'en-US', {
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

export function HoldingsTable({ holdings, isLoading, usdIlsRate = 3.7, cashBalances }: HoldingsTableProps) {
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
          <tr className="border-b border-gray-100 dark:border-gray-700/60 text-xs font-semibold text-gray-400 dark:text-gray-400">
            <th className="text-right py-3.5 px-4 font-semibold">נייר</th>
            <th className="text-left py-3.5 px-4 font-semibold">סימבול</th>
            <th className="text-left py-3.5 px-4 font-semibold">כמות</th>
            <th className="text-left py-3.5 px-4 font-semibold">מחיר נוכחי</th>
            <th className="text-left py-3.5 px-4 font-semibold">שינוי יומי</th>
            <th className="text-left py-3.5 px-4 font-semibold">עלות ממוצעת</th>
            <th className="text-left py-3.5 px-4 font-semibold">שווי נוכחי</th>
            <th className="text-left py-3.5 px-4 font-semibold">שווי ב-₪</th>
            <th className="text-left py-3.5 px-4 font-semibold">רווח/הפסד</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {holdings.map((holding, index) => {
            const isProfitable = (holding.pnl || 0) >= 0;
            const isDayPositive = (holding.dayChange || 0) >= 0;
            const currency = holding.currency || 'USD';
            
            return (
              <tr 
                key={holding.id || index}
                className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td className="py-4 px-4">
                  <a 
                    href={`/stock/${holding.symbol}`}
                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer block"
                  >
                    {holding.name}
                  </a>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col items-start gap-1">
                    <a 
                      href={`/stock/${holding.symbol}`}
                      className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {holding.symbol}
                    </a>
                    {holding.hasLiveQuote ? (
                      <span 
                        className="inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded-md border border-green-200/60 dark:border-green-800"
                        title="ציטוט חי מעודכן מ-Yahoo Finance"
                      >
                        🟢 ציטוט חי
                      </span>
                    ) : (
                      <span 
                        className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800"
                        title="אין ציטוט חי מבורסת תל אביב - המחיר מעודכן לפי העסקה האחרונה בדוח"
                      >
                        ⏱️ מחיר מעסקה
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300 font-medium">
                  {formatNumber(holding.quantity, holding.quantity % 1 === 0 ? 0 : 4)}
                </td>
                <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(holding.currentPrice || 0, currency)}
                </td>
                <td className="py-4 px-4">
                  {holding.hasLiveQuote ? (
                    <div className={`flex flex-col ${isDayPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      <span className="font-semibold">
                        {isDayPositive ? '+' : ''}{formatCurrency(holding.dayChange || 0, currency)}
                      </span>
                      <span className="text-xs font-medium">
                        {formatPercent(holding.dayChangePercent || 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      —
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                  {formatCurrency(holding.avgPrice, currency)}
                </td>
                <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(holding.currentValue || 0, currency)}
                </td>
                <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">
                  {formatNumber(holding.currentValueILS || 0, 0)} ₪
                </td>
                <td className="py-4 px-4">
                  <div className={`inline-flex flex-col px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    isProfitable 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40' 
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40'
                  }`}>
                    <span className="font-bold">
                      {isProfitable ? '+' : ''}{formatCurrency(holding.pnl || 0, currency)}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {formatPercent(holding.pnlPercent || 0)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}

          {/* USD Cash Position (matching Meitav Trade's נייר 99028 דולר ארה"ב) */}
          {cashBalances && cashBalances.usd > 0 && (
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-blue-50/20 dark:bg-blue-900/10">
              <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span>דולר ארה"ב (מזומן)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                    מזומן מט"ח
                  </span>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="font-mono text-gray-600 dark:text-gray-400">99028</span>
              </td>
              <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                {formatNumber(cashBalances.usd, 2)}
              </td>
              <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                {formatCurrency(1, 'USD')}
              </td>
              <td className="py-4 px-4 text-gray-400 dark:text-gray-500 text-xs">
                —
              </td>
              <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                {formatCurrency(1, 'USD')}
              </td>
              <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                {formatCurrency(cashBalances.usd, 'USD')}
              </td>
              <td className="py-4 px-4 font-semibold text-blue-600 dark:text-blue-400">
                {formatNumber(cashBalances.usd * usdIlsRate, 0)} ₪
              </td>
              <td className="py-4 px-4 text-gray-400 dark:text-gray-500 text-xs">
                —
              </td>
            </tr>
          )}

          {/* ILS Cash Position (matching Meitav Trade's יתרה שקלית) */}
          {cashBalances && cashBalances.ils > 0 && (
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-green-50/20 dark:bg-green-900/10">
              <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <span>🇮🇱</span>
                  <span>מזומן שקלי (עו"ש)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">
                    יתרה שקלית
                  </span>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="font-mono text-gray-600 dark:text-gray-400">ILS</span>
              </td>
              <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                {formatNumber(cashBalances.ils, 2)}
              </td>
              <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                {formatCurrency(1, 'ILS')}
              </td>
              <td className="py-4 px-4 text-gray-400 dark:text-gray-500 text-xs">
                —
              </td>
              <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                {formatCurrency(1, 'ILS')}
              </td>
              <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                {formatCurrency(cashBalances.ils, 'ILS')}
              </td>
              <td className="py-4 px-4 font-semibold text-green-600 dark:text-green-400">
                {formatNumber(cashBalances.ils, 0)} ₪
              </td>
              <td className="py-4 px-4 text-gray-400 dark:text-gray-500 text-xs">
                —
              </td>
            </tr>
          )}
        </tbody>

        {cashBalances && (
          <tfoot>
            <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-bold bg-gray-50 dark:bg-gray-800/50">
              <td colSpan={7} className="py-3 px-4 text-right text-gray-900 dark:text-white">
                סה"כ שווי התיק (כולל יתרות מזומן שקליות ודולריות):
              </td>
              <td className="py-3 px-4 text-blue-600 dark:text-blue-400 text-base font-extrabold">
                {formatNumber(
                  holdings.reduce((sum, h) => sum + (h.currentValueILS || 0), 0) + (cashBalances.totalILS || 0),
                  0
                )} ₪
              </td>
              <td className="py-3 px-4"></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
