'use client';

import React, { useState } from 'react';
import { BehavioralAuditStats, TradeAuditItem } from '@/lib/analytics/intelligence';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  Brain,
  AlertTriangle,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Info,
} from 'lucide-react';

interface BehavioralAuditProps {
  stats: BehavioralAuditStats;
  isLoading?: boolean;
}

export function BehavioralAudit({ stats, isLoading }: BehavioralAuditProps) {
  const { isPrivate } = usePrivacy();
  const [filterBehavior, setFilterBehavior] = useState<string>('all');

  const formatILS = (val: number) => {
    if (isPrivate) return '•••• ₪';
    return `₪${Math.round(val).toLocaleString()}`;
  };

  const formatPercent = (val: number) => {
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(1)}%`;
  };

  const filteredTrades = stats.trades.filter((t) => {
    if (filterBehavior === 'all') return true;
    return t.behavior === filterBehavior;
  });

  const getBehaviorBadge = (item: TradeAuditItem) => {
    switch (item.behavior) {
      case 'FOMO_CHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <Flame className="w-3 h-3 text-rose-500" />
            רדיפה אחרי עליות (FOMO)
          </span>
        );
      case 'DIP_BUYER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Target className="w-3 h-3 text-emerald-500" />
            קנייה מושכלת בשפל (Dip)
          </span>
        );
      case 'DISCIPLINED_DCA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            הפקדה ממושמעת (DCA)
          </span>
        );
      case 'PANIC_SELL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            מכירה מוקדמת (Paper Hands)
          </span>
        );
      case 'PROFIT_TAKE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            <Sparkles className="w-3 h-3 text-purple-500" />
            מימוש רווחים מוצלח
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            מסחר רגיל
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Overall Timing Score */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/30">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              ציון תזמון ומשמעת רגשית
            </span>
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {stats.overallTimingScore}/100
            </p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              {stats.disciplineRating}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            מבוסס על ניתוח רכישות ומכירות בפועל
          </p>
        </div>

        {/* Dip Buys Avg Return */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              תשואת קניות בשפל (Buy The Dip)
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPercent(stats.dipBuyAvgReturn90d)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>ממוצע 90 ימים לאחר קנייה בתיקון</span>
          </div>
        </div>

        {/* FOMO Buys Avg Return */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              תשואת קניות ב-FOMO (רדיפה)
            </span>
            <Flame className="w-5 h-5 text-rose-500" />
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black ${
              stats.fomoAvgReturn90d < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {formatPercent(stats.fomoAvgReturn90d)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>ממוצע 90 יום מקנייה אחרי זינוק</span>
          </div>
        </div>

        {/* Alpha from Discipline */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              פרמיית משמעת (Discipline Alpha)
            </span>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            +{stats.alphaFromDisciplinePercent}%
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>פער התשואה בין קנייה בשפל ל-FOMO</span>
          </div>
        </div>
      </div>

      {/* Behavioral Insights Section */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span>תובנות התנהגותיות ולמידה אישית מתוך העסקאות שלך</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {stats.behavioralInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 sm:p-5 rounded-2xl border text-right space-y-2 ${
                insight.type === 'fomo_alert'
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                  : insight.type === 'timing_stat'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                  : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    insight.type === 'fomo_alert'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      : insight.type === 'timing_stat'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}
                >
                  {insight.statValue || 'תובנה'}
                </span>
                {insight.type === 'fomo_alert' ? (
                  <Flame className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                {insight.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setFilterBehavior('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterBehavior === 'all'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            כל העסקאות ({stats.trades.length})
          </button>
          <button
            onClick={() => setFilterBehavior('DIP_BUYER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterBehavior === 'DIP_BUYER'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            קניות בשפל ({stats.dipBuysCount})
          </button>
          <button
            onClick={() => setFilterBehavior('FOMO_CHASE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterBehavior === 'FOMO_CHASE'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            רדיפת מומנטום ({stats.fomoTradesCount})
          </button>
          <button
            onClick={() => setFilterBehavior('DISCIPLINED_DCA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterBehavior === 'DISCIPLINED_DCA'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            הפקדות שיטתיות ({stats.disciplinedTradesCount})
          </button>
        </div>

        <span className="text-xs text-gray-400">
          ניתוח התנהגות לפי ציר הזמן של כל עסקה
        </span>
      </div>

      {/* Trades Timeline & Verdicts Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60 text-gray-400 font-semibold">
                <th className="py-2.5 px-3">תאריך וסוג</th>
                <th className="py-2.5 px-3">נכס / נייר ערך</th>
                <th className="py-2.5 px-3">סכום בש"ח</th>
                <th className="py-2.5 px-3">מומנטום טרם העסקה (30d)</th>
                <th className="py-2.5 px-3">תוצאה לאחר 90 יום</th>
                <th className="py-2.5 px-3">סיווג התנהגותי</th>
                <th className="py-2.5 px-3 text-left">מסקנת תזמון</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredTrades.map((t) => {
                const isPrePositive = t.preTradeReturn30d > 0;
                const isPostPositive = t.postTradeReturn90d > 0;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {t.date}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-black ${
                          t.type === 'BUY'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                      >
                        {t.type === 'BUY' ? 'קנייה' : 'מכירה'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {t.symbol}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                        {t.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-gray-900 dark:text-white">
                      {formatILS(t.amountILS)}
                    </td>

                    <td className="py-3.5 px-3 font-bold">
                      <span
                        className={
                          isPrePositive
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {formatPercent(t.preTradeReturn30d)}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-normal">
                        {isPrePositive ? 'עלתה לפני הקנייה' : 'ירדה לפני הקנייה'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-bold">
                      <span
                        className={
                          isPostPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {formatPercent(t.postTradeReturn90d)}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-normal">
                        תשואת הנייר לאחר מכן
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {getBehaviorBadge(t)}
                    </td>

                    <td className="py-3.5 px-3 text-left">
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 block max-w-[200px] leading-tight">
                        {t.postTradeVerdict}
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
