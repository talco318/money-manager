'use client';

import React from 'react';
import { RiskMetricsStats } from '@/lib/analytics/intelligence';
import {
  ShieldAlert,
  TrendingUp,
  BarChart2,
  Activity,
  Award,
  Info,
  CheckCircle,
  Zap,
} from 'lucide-react';

interface RiskAdjustedMetricsProps {
  stats: RiskMetricsStats;
}

export function RiskAdjustedMetrics({ stats }: RiskAdjustedMetricsProps) {
  const getSharpeBadge = (sharpe: number) => {
    if (sharpe >= 1.0) {
      return { text: 'מעולה (מוסדי)', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    }
    if (sharpe >= 0.5) {
      return { text: 'טוב ומאוזן', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };
    }
    return { text: 'טעון שיפור', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
  };

  const getSortinoBadge = (sortino: number) => {
    if (sortino >= 1.5) {
      return { text: 'הגנת ירידות יוצאת דופן', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    }
    if (sortino >= 0.8) {
      return { text: 'הגנת ירידות טובה', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };
    }
    return { text: 'רגיש לירידות שוק', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
  };

  const sharpeBadge = getSharpeBadge(stats.sharpeRatio);
  const sortinoBadge = getSortinoBadge(stats.sortinoRatio);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Institutional Risk Score */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-400">
                Institutional Risk Rating
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                ציון {stats.institutionalScore}/100
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black mt-1">
              פרופיל תיק: {stats.riskProfileLabel}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              מדדי שארפ וסורטינו מודדים כמה תשואה התיק שלך מייצר על כל יחידת סיכון שנלקחת, מעבר לריבית חסרת סיכון של {stats.riskFreeRatePercent}%.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-400 font-medium">אלפא (תשואה עודפת)</p>
            <p className={`text-lg font-black ${stats.benchmark.alphaPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.benchmark.alphaPercent >= 0 ? '+' : ''}{stats.benchmark.alphaPercent}%
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-400 font-medium">בטא (רגישות לשוק)</p>
            <p className="text-lg font-black text-blue-400">
              {stats.benchmark.beta}x
            </p>
          </div>
        </div>
      </div>

      {/* Core 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Sharpe Ratio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              מדד שארפ (Sharpe)
            </span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {stats.sharpeRatio}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              (S&P 500: {stats.benchmark.sp500Sharpe})
            </span>
          </div>

          <div className={`text-[11px] px-2.5 py-1 rounded-xl border font-bold inline-block ${sharpeBadge.color}`}>
            {sharpeBadge.text}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            תשואה שנתית ביחס לתנודתיות הכללית. ערך מעל 0.7 נחשב לאיכותי מאוד.
          </p>
        </div>

        {/* Metric 2: Sortino Ratio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              מדד סורטינו (Sortino)
            </span>
            <ShieldAlert className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {stats.sortinoRatio}
            </span>
            <span className="text-xs text-emerald-500 font-bold">
              סטיית ירידה {stats.downsideDeviationPercent}%
            </span>
          </div>

          <div className={`text-[11px] px-2.5 py-1 rounded-xl border font-bold inline-block ${sortinoBadge.color}`}>
            {sortinoBadge.text}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            מודד תשואה ביחס לתנודתיות של הפסדים בלבד (מתעלם מתנודתיות חיובית בריאה).
          </p>
        </div>

        {/* Metric 3: Max Drawdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              נפילה מקסימלית (Max Drawdown)
            </span>
            <TrendingUp className="w-5 h-5 text-rose-500" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.maxDrawdownPercent}%
            </span>
            <span className="text-xs text-gray-400 font-medium">
              (S&P 500: {stats.benchmark.sp500MaxDrawdown}%)
            </span>
          </div>

          <div className="text-[11px] px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-bold inline-block">
            {stats.recoveryStatus === 'at_peak' ? 'התיק בשיא כל הזמנים' : 'התאושש מהשפל'}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            הירידה העמוקה ביותר שחווה התיק מהשיא לקרקעית בתקופת המדידה.
          </p>
        </div>

        {/* Metric 4: Annualized Volatility */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              תנודתיות שנתית (Standard Dev)
            </span>
            <BarChart2 className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {stats.annualizedVolatilityPercent}%
            </span>
            <span className="text-xs text-gray-400 font-medium">
              (S&P 500: {stats.benchmark.sp500Volatility}%)
            </span>
          </div>

          <div className="text-[11px] px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold inline-block">
            {stats.annualizedVolatilityPercent < stats.benchmark.sp500Volatility ? 'נמוכה ממדד S&P 500' : 'תנודתיות שוק סטנדרטית'}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            סטיית תקן של שינויי התשואה השנתיים. ככל שנמוכה יותר, התיק יציב יותר.
          </p>
        </div>
      </div>

      {/* Head-to-Head Comparison Table vs S&P 500 */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/60">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            השוואת ביצועים מותאמי-סיכון: התיק שלך מול מדד S&P 500
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            השוואה מלאה בראי מנהלי השקעות מוסדיים
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-3.5 px-4 font-bold">מדד פיננסי</th>
                <th className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">התיק שלך</th>
                <th className="py-3.5 px-4 font-bold text-gray-600 dark:text-gray-300">מדד S&P 500</th>
                <th className="py-3.5 px-4 font-bold">משמעות ויתרון</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                  מדד שארפ (Sharpe Ratio)
                </td>
                <td className="py-3.5 px-4 font-black text-blue-600 dark:text-blue-400 text-base">
                  {stats.sharpeRatio}
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                  {stats.benchmark.sp500Sharpe}
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                  {stats.sharpeRatio >= stats.benchmark.sp500Sharpe
                    ? '🏆 התיק שלך מייצר יותר תשואה לכל אחוז תנודתיות מאשר ה-S&P 500'
                    : 'תשואה מאוזנת עם פרופיל סיכון סולידי'}
                </td>
              </tr>

              <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                  מדד סורטינו (Sortino Ratio)
                </td>
                <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-base">
                  {stats.sortinoRatio}
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                  0.92
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                  עמידות גבוהה בעת ירידות חדות בשווקים העולמיים
                </td>
              </tr>

              <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                  תנודתיות שנתית (Volatility)
                </td>
                <td className="py-3.5 px-4 font-black text-gray-900 dark:text-white">
                  {stats.annualizedVolatilityPercent}%
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                  {stats.benchmark.sp500Volatility}%
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                  סטיית תקן שנתית המודדת את חדות תנודות המחיר
                </td>
              </tr>

              <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                  נפילה מקסימלית (Max Drawdown)
                </td>
                <td className="py-3.5 px-4 font-black text-rose-600 dark:text-rose-400">
                  {stats.maxDrawdownPercent}%
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                  {stats.benchmark.sp500MaxDrawdown}%
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                  הירידה העמוקה ביותר שחווה התיק בגל ירידות
                </td>
              </tr>

              <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                  ריבית חסרת סיכון (Risk-Free Benchmark)
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                  {stats.riskFreeRatePercent}%
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                  {stats.riskFreeRatePercent}%
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                  ריבית בנק ישראל והפד על פיקדונות/מק"מ קצרים
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
