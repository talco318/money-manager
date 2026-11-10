'use client';

import React, { useState } from 'react';
import { FxAttributionResult } from '@/lib/analytics/intelligence';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Coins,
  ShieldCheck,
  Info,
  HelpCircle,
} from 'lucide-react';

interface FxAttributionProps {
  stats: FxAttributionResult;
  isLoading?: boolean;
}

export function FxAttribution({ stats, isLoading }: FxAttributionProps) {
  const { isPrivate } = usePrivacy();
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  const formatILS = (val: number) => {
    if (isPrivate) return '•••• ₪';
    const prefix = val > 0 ? '+' : '';
    return `${prefix}₪${Math.round(val).toLocaleString()}`;
  };

  const formatPlainILS = (val: number) => {
    if (isPrivate) return '•••• ₪';
    return `₪${Math.round(val).toLocaleString()}`;
  };

  const formatPercent = (val: number) => {
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(2)}%`;
  };

  const isFxPositive = stats.fxImpactILS >= 0;
  const isAlphaPositive = stats.assetAlphaILS >= 0;
  const isTotalPositive = stats.totalReturnILS >= 0;

  // Rate change between average buy and current
  const fxRateChangePercent =
    stats.averageBuyUsdRate > 0
      ? ((stats.currentUsdRate - stats.averageBuyUsdRate) / stats.averageBuyUsdRate) * 100
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Summary Alert Banner */}
      <div
        className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
          stats.fxStatus === 'boost'
            ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
            : stats.fxStatus === 'drag'
            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
            : 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
        }`}
      >
        <ArrowRightLeft
          className={`w-5 h-5 shrink-0 mt-0.5 ${
            stats.fxStatus === 'boost'
              ? 'text-emerald-600 dark:text-emerald-400'
              : stats.fxStatus === 'drag'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}
        />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-black ${
                stats.fxStatus === 'boost'
                  ? 'text-emerald-900 dark:text-emerald-200'
                  : stats.fxStatus === 'drag'
                  ? 'text-amber-900 dark:text-amber-200'
                  : 'text-blue-900 dark:text-blue-200'
              }`}
            >
              ניתוח השפעת מטבע: {stats.fxStatus === 'boost' ? 'רוח גבית (FX Boost) 🚀' : stats.fxStatus === 'drag' ? 'שחיקת שקל (FX Drag) 📉' : 'השפעה מאוזנת ⚖️'}
            </h4>
          </div>
          <p
            className={`text-xs leading-relaxed ${
              stats.fxStatus === 'boost'
                ? 'text-emerald-800 dark:text-emerald-300'
                : stats.fxStatus === 'drag'
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-blue-800 dark:text-blue-300'
            }`}
          >
            {stats.executiveSummary}
          </p>
        </div>
      </div>

      {/* 4 Key Attribution Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Return */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold">רווח/הפסד כולל בש"ח</span>
            <Coins className="w-5 h-5 text-purple-500" />
          </div>
          <p
            className={`text-xl sm:text-2xl font-black ${
              isTotalPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatILS(stats.totalReturnILS)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span
              className={`font-black ${
                isTotalPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatPercent(stats.totalReturnPercent)}
            </span>
            <span>תשואה נומינלית בשקלים</span>
          </div>
        </div>

        {/* Asset Alpha (Stock Growth) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              תשואת מניות נקייה (Asset Alpha)
            </span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p
            className={`text-xl sm:text-2xl font-black ${
              isAlphaPositive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatILS(stats.assetAlphaILS)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span
              className={`font-black ${
                isAlphaPositive ? 'text-blue-600' : 'text-rose-600'
              }`}
            >
              {formatPercent(stats.assetAlphaPercent)}
            </span>
            <span>עליית ערך המניות במטבע המקור</span>
          </div>
        </div>

        {/* FX Impact (Currency Shift) */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border ${
            isFxPositive
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              תרומת שינוי שער (FX Impact)
            </span>
            <ArrowRightLeft
              className={`w-5 h-5 ${
                isFxPositive ? 'text-emerald-500' : 'text-amber-500'
              }`}
            />
          </div>
          <p
            className={`text-xl sm:text-2xl font-black ${
              isFxPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {formatILS(stats.fxImpactILS)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-600 dark:text-gray-300">
            <span
              className={`font-black ${
                isFxPositive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {formatPercent(stats.fxImpactPercent)}
            </span>
            <span>{isFxPositive ? 'רווח מחיזוק הדולר' : 'שחיקה עקב התחזקות השקל'}</span>
          </div>
        </div>

        {/* Exchange Rate Movement */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold">שער קנייה ממוצע vs שער נוכחי</span>
            <DollarSign className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              ₪{stats.currentUsdRate.toFixed(3)}
            </p>
            <span className="text-xs text-gray-400 line-through">
              ₪{stats.averageBuyUsdRate.toFixed(3)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            שינוי שער ממוצע של{' '}
            <span
              className={`font-bold ${
                fxRateChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatPercent(fxRateChangePercent)}
            </span>
          </p>
        </div>
      </div>

      {/* Visual Return Attribution Bar & Currency Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Breakdown Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-900 dark:text-white">
              פירוק מקורות הרווח בתיק (Brinson Decomposition)
            </h4>
            <button
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="text-gray-400 hover:text-blue-500 transition-colors"
              title="מידע על נוסחת החישוב"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {showFormulaInfo && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">
              <p className="font-bold text-gray-800 dark:text-gray-200">
                כיצד מחושב הפירוק?
              </p>
              <p>
                <strong>Asset Alpha (תשואת נכס):</strong> הרווח שהניירות צברו במטבע המסחר שלהם (בדולר או שקל), מתורגם לפי שער הקנייה המקורי שלך.
              </p>
              <p>
                <strong>FX Impact (תרומת מט"ח):</strong> שווי הנכס הנוכחי מוכפל בפער שבין שער הדולר היום לשער הדולר ביום הקנייה.
              </p>
              <p className="text-blue-600 dark:text-blue-400 font-mono text-[10px]">
                סה"כ רווח שקלי = Asset Alpha + FX Impact
              </p>
            </div>
          )}

          {/* Graphical Visual Comparison */}
          <div className="space-y-3 pt-1">
            {/* Asset Alpha Row */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-600 dark:text-blue-400">
                  צמיחת מניות / קרנות נטו (Asset Return)
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatILS(stats.assetAlphaILS)} ({formatPercent(stats.assetAlphaPercent)})
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        (Math.abs(stats.assetAlphaILS) /
                          (Math.abs(stats.assetAlphaILS) + Math.abs(stats.fxImpactILS) || 1)) *
                          100,
                        10
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* FX Row */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span
                  className={
                    isFxPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }
                >
                  השפעת תנודת שער החליפין (USD/ILS)
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatILS(stats.fxImpactILS)} ({formatPercent(stats.fxImpactPercent)})
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFxPositive ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      Math.max(
                        (Math.abs(stats.fxImpactILS) /
                          (Math.abs(stats.assetAlphaILS) + Math.abs(stats.fxImpactILS) || 1)) *
                          100,
                        5
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Currency Allocation Bar Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-900 dark:text-white">
              התפלגות חשיפת מטבע בפועל
            </h4>
            <span className="text-xs text-gray-400">לפי שווי שוק נוכחי</span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            מראה איזה חלק מההון שלך מושפע ישירות משער הדולר מול השקל.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex h-5 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              <div
                className="bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-500"
                style={{ width: `${stats.dollarExposurePercent}%` }}
              >
                {stats.dollarExposurePercent > 15 ? `$ ${stats.dollarExposurePercent.toFixed(1)}%` : ''}
              </div>
              <div
                className="bg-blue-400 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-500"
                style={{ width: `${stats.shekelExposurePercent}%` }}
              >
                {stats.shekelExposurePercent > 15 ? `₪ ${stats.shekelExposurePercent.toFixed(1)}%` : ''}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-bold pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                <span className="text-gray-700 dark:text-gray-300">
                  חשיפה לדולר ארה"ב (USD): {stats.dollarExposurePercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                <span className="text-gray-700 dark:text-gray-300">
                  חשיפה לשקל ישראלי (ILS): {stats.shekelExposurePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Detailed Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-black text-gray-900 dark:text-white">
              פירוק תשואת מטבע לפי נייר ערך
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              כמה מהרווח של כל מניה מגיע מביצועי החברה וכמה משינוי שער הדולר
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60 text-gray-400 font-semibold">
                <th className="py-2.5 px-3">נכס / נייר ערך</th>
                <th className="py-2.5 px-3">מטבע</th>
                <th className="py-2.5 px-3">שווי נוכחי</th>
                <th className="py-2.5 px-3">תשואת נכס נקייה</th>
                <th className="py-2.5 px-3">השפעת מט"ח %</th>
                <th className="py-2.5 px-3">תשואה שקלית כוללת</th>
                <th className="py-2.5 px-3 text-left">תרומת מט"ח בש"ח</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {stats.holdings.map((h) => {
                const isItemFxPositive = h.fxContributionILS >= 0;
                const isTotalGain = h.totalReturnILS >= 0;

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
                          h.currency === 'USD'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {h.currency}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-200">
                      {formatPlainILS(h.currentValueILS)}
                    </td>

                    <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                      {formatPercent(h.nativeReturnPercent)}
                    </td>

                    <td
                      className={`py-3 px-3 font-bold ${
                        isItemFxPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {h.currency === 'ILS' ? '0.00%' : formatPercent(h.fxReturnPercent)}
                    </td>

                    <td
                      className={`py-3 px-3 font-black ${
                        isTotalGain
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatPercent(h.totalReturnPercent)}
                    </td>

                    <td className="py-3 px-3 text-left">
                      <span
                        className={`inline-block font-black px-2 py-0.5 rounded-md text-[11px] ${
                          h.currency === 'ILS'
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            : isItemFxPositive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {h.currency === 'ILS' ? 'ללא השפעה' : formatILS(h.fxContributionILS)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
