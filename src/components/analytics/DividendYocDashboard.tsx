'use client';

import React, { useState } from 'react';
import { DividendYocResult, ForwardMonthIncome } from '@/lib/analytics/intelligence';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  Coins,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
  DollarSign,
  Smartphone,
  Flame,
  Home,
  ShoppingCart,
  Layers,
} from 'lucide-react';

interface DividendYocDashboardProps {
  stats: DividendYocResult;
  isLoading?: boolean;
}

export function DividendYocDashboard({ stats, isLoading }: DividendYocDashboardProps) {
  const { isPrivate } = usePrivacy();
  const [selectedMonth, setSelectedMonth] = useState<ForwardMonthIncome | null>(null);

  const formatILS = (val: number) => {
    if (isPrivate) return '•••• ₪';
    return `₪${Math.round(val).toLocaleString()}`;
  };

  const formatUSD = (val: number) => {
    if (isPrivate) return '$••••';
    return `$${Math.round(val).toLocaleString()}`;
  };

  const formatPercent = (val: number) => {
    return `${val.toFixed(2)}%`;
  };

  // Find max monthly payout for bar scaling
  const maxMonthILS = Math.max(...stats.forward12Months.map((m) => m.projectedILS), 10);

  const getMilestoneIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-blue-500" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Home':
        return <Home className="w-5 h-5 text-purple-500" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Yield on Cost (YOC) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              תשואה על העלות (Weighted YOC)
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPercent(stats.portfolioWeightedYoc)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>ביחס למחיר הקנייה המקורי שלך</span>
          </div>
        </div>

        {/* Current Market Yield */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              תשואת שוק נוכחית (Current Yield)
            </span>
            <Coins className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {formatPercent(stats.portfolioWeightedCurrentYield)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>לפי שווי שוק עדכני של התיק</span>
          </div>
        </div>

        {/* Annual Forward Income */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              תזרים שנתי חזוי (12M Forward)
            </span>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {formatILS(stats.totalAnnualProjectedILS)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>שווה ערך ל-{formatUSD(stats.totalAnnualProjectedUSD)} בשנה</span>
          </div>
        </div>

        {/* Monthly Average Income */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              ממוצע תזרים פסיבי לחודש
            </span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {formatILS(stats.monthlyAverageILS)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>הכנסה חודשית ממוצעת נטו</span>
          </div>
        </div>
      </div>

      {/* 12-Month Forward Projection Bar Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              לוח שנה חזוי: 12 חודשים קדימה (Projected Income Calendar)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              צפי חלוקות דיבידנד לפי היסטוריית החברות והמועדים הצפויים
            </p>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold self-start sm:self-auto">
            לחץ על חודש לפירוט המשלמות
          </span>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-4">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 h-44 items-end">
            {stats.forward12Months.map((m) => {
              const heightPercent = Math.max((m.projectedILS / maxMonthILS) * 100, 6);
              const isSelected = selectedMonth?.monthIndex === m.monthIndex;

              return (
                <div
                  key={m.monthIndex}
                  onClick={() => setSelectedMonth(m)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip / Value on hover */}
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                    {formatILS(m.projectedILS)}
                  </span>

                  {/* Visual Bar */}
                  <div className="w-full max-w-[28px] h-32 flex items-end justify-center">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isSelected
                          ? 'bg-blue-600 dark:bg-blue-500 shadow-md ring-2 ring-blue-400'
                          : m.projectedILS > 0
                          ? 'bg-blue-400/80 dark:bg-blue-600/70 hover:bg-blue-500'
                          : 'bg-gray-100 dark:bg-gray-700/40'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-[11px] font-bold mt-2 truncate ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400 font-black'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {m.monthName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Month Details Box */}
        {selectedMonth && (
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  צפי חלוקה לחודש {selectedMonth.monthName}:
                </span>
                <span className="text-sm font-black text-blue-900 dark:text-blue-100 mr-2">
                  {formatILS(selectedMonth.projectedILS)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-blue-800/80 dark:text-blue-300">
                ניירות ערך משלמים:
              </span>
              {selectedMonth.payingSymbols.length > 0 ? (
                selectedMonth.payingSymbols.map((sym) => (
                  <span
                    key={sym}
                    className="px-2 py-0.5 rounded-md text-[11px] font-black bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                  >
                    {sym}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">אין חלוקה צפויה</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Household Expense Coverage Milestones */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-4">
        <div>
          <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>משכורת פסיבית: כיסוי הוצאות שוטפות בדיבידנדים</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            הדיבידנדים החודשיים שלך מייצרים הכנסה ריאלית שמממנת יעדי מחיה אמיתיים
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {stats.milestones.map((m) => {
            const isFull = m.coveredPercent >= 100;
            return (
              <div
                key={m.title}
                className={`p-4 rounded-xl border transition-all ${
                  isFull
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-2xs">
                    {getMilestoneIcon(m.iconName)}
                  </div>
                  {isFull ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      מכוסה 🚀
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400">
                      {m.coveredPercent.toFixed(0)}% מכוסה
                    </span>
                  )}
                </div>

                <h5 className="text-xs font-black text-gray-900 dark:text-white mb-0.5">
                  {m.title}
                </h5>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5">
                  {formatILS(m.monthlyCostILS)} לחודש
                </p>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(m.coveredPercent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Holdings YOC Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-black text-gray-900 dark:text-white">
              תשואה על העלות (YOC) לפי נייר ערך
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              השוואת תשואת השוק לתשואה בפועל שאתה מקבל על סכום ההשקעה המקורי
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60 text-gray-400 font-semibold">
                <th className="py-2.5 px-3">נכס / נייר ערך</th>
                <th className="py-2.5 px-3">סוג חלוקה</th>
                <th className="py-2.5 px-3">מחיר קנייה ממוצע</th>
                <th className="py-2.5 px-3">מחיר שוק</th>
                <th className="py-2.5 px-3">תשואת שוק %</th>
                <th className="py-2.5 px-3">Yield On Cost (YOC)</th>
                <th className="py-2.5 px-3">מרווח צמיחה</th>
                <th className="py-2.5 px-3 text-left">תזרים שנתי חזוי</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {stats.holdings.map((h) => {
                const isReinvesting = h.frequency === 'reinvesting';
                const hasGrowth = h.yocSpreadPercent > 0;

                return (
                  <tr
                    key={h.symbol}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {h.symbol}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[170px]">
                        {h.name}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isReinvesting
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                      >
                        {isReinvesting
                          ? 'צוברת דיבידנד (UCITS)'
                          : h.frequency === 'quarterly'
                          ? 'רבעוני'
                          : h.frequency === 'semi-annual'
                          ? 'חצי-שנתי'
                          : 'שנתי'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">
                      {h.currency === 'USD' ? '$' : '₪'}
                      {h.avgBuyPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                      {h.currency === 'USD' ? '$' : '₪'}
                      {h.currentPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      {formatPercent(h.currentYieldPercent)}
                    </td>

                    <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400">
                      {formatPercent(h.yieldOnCostPercent)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          hasGrowth
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {hasGrowth ? `+${h.yocSpreadPercent.toFixed(2)}%` : '0.00%'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-left font-black text-gray-900 dark:text-white">
                      {isReinvesting ? (
                        <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400">
                          {formatILS(h.projectedAnnualIncomeILS)} (מושקע מחדש)
                        </span>
                      ) : (
                        formatILS(h.projectedAnnualIncomeILS)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Insights Box */}
      <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-black text-gray-800 dark:text-gray-200">
          <Info className="w-4 h-4 text-blue-500" />
          <span>תובנות אסטרטגיות על הדיבידנדים בתיק:</span>
        </div>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc list-inside leading-relaxed">
          {stats.insights.map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

