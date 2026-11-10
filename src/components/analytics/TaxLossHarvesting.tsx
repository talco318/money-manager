'use client';

import React from 'react';
import { TaxHarvestingStats } from '@/lib/analytics/intelligence';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  Scale,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  Info,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';

interface TaxLossHarvestingProps {
  stats: TaxHarvestingStats;
}

export function TaxLossHarvesting({ stats }: TaxLossHarvestingProps) {
  const { isPrivate } = usePrivacy();

  const formatILS = (val: number) => {
    if (isPrivate) return '•••• ₪';
    return `₪${Math.round(val).toLocaleString()}`;
  };

  const hasCandidates = stats.candidates.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Potential Tax Savings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              חיסכון מס פוטנציאלי
            </span>
            <Scale className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatILS(stats.totalPotentialTaxSavingsILS)}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            25% מס רווחי הון לקיזוז
          </p>
        </div>

        {/* Card 2: Unrealized Losses */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              הפסדים צבורים ברי-קצירה
            </span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatILS(stats.totalUnrealizedLossILS)}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {stats.candidates.length} פוזיציות כרגע בהפסד
          </p>
        </div>

        {/* Card 3: Realized Gains Year to Date */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              רווחי הון ממומשים השנה
            </span>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatILS(stats.currentYearRealizedGainILS)}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            חייבים במס רווחי הון לשנת 2026
          </p>
        </div>

        {/* Card 4: Year End Deadline */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              מועד סוף שנת המס
            </span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {stats.daysUntilYearEnd} ימים
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            עד ל-31 בדצמבר לקיזוז השנה
          </p>
        </div>
      </div>

      {/* Actionable Strategy Advice Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 ${
          stats.harvestOpportunityScore === 'high'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            : stats.harvestOpportunityScore === 'medium'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200'
            : 'bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          {stats.harvestOpportunityScore === 'high' ? (
            <Sparkles className="w-5 h-5 text-emerald-500" />
          ) : (
            <Info className="w-5 h-5 text-blue-500" />
          )}
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold flex items-center gap-2">
            המלצה אסטרטגית למיטוב מס:
            {stats.harvestOpportunityScore === 'high' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
                הזדמנות גבוהה
              </span>
            )}
          </h4>
          <p className="text-xs sm:text-sm leading-relaxed opacity-90">
            {stats.actionableSummary}
          </p>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              פוזיציות פוטנציאליות לקצירת הפסד
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              ניירות שנמצאים כרגע במחיר נמוך ממחיר העלות הממוצע שלך
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500">
            {stats.candidates.length} פוזיציות
          </span>
        </div>

        {hasCandidates ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {stats.candidates.map((c) => (
              <div key={c.symbol} className="p-4 sm:p-5 space-y-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 dark:text-white text-base">
                        {c.symbol}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        • {c.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      החזקה: {c.quantity.toLocaleString()} יחידות | עלות ממוצעת: {c.avgPrice} {c.currency} | מחיר נוכחי: {c.currentPrice} {c.currency}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-left self-end sm:self-auto">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">הפסד צבור</p>
                      <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                        {formatILS(c.unrealizedLossILS)} ({c.unrealizedLossPercent.toFixed(1)}%)
                      </p>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-left">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        מגן מס שייווצר
                      </p>
                      <p className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                        +{formatILS(c.potentialTaxSavingsILS)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Replacement Recommendation */}
                {c.replacementSuggestion && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-700 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <ArrowRightLeft className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        החלפה מומלצת לשמירה על חשיפת השוק:
                      </span>{' '}
                      מעבר ל-<strong>{c.replacementSuggestion.name} ({c.replacementSuggestion.symbol})</strong>.
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                        {c.replacementSuggestion.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-gray-900 dark:text-white">
              כל הפוזיציות שלך ברווח! 🚀
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              לא זוהו פוזיציות בהפסד כרגע בתיק. התיק שלך בצמיחה ירוקה ולא נדרשת קצירת הפסדים.
            </p>
          </div>
        )}
      </div>

      {/* Explanatory Guide Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 space-y-3">
        <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          איך עובדת קצירת הפסדי מס (Tax-Loss Harvesting)?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
            <span className="font-bold text-gray-900 dark:text-white block mb-1">
              1. נעילת ההפסד
            </span>
            מכירת נייר ערך שירד זמנית כדי לקבע הפסד הון חשבונאי מול רשויות המס ומיטב.
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
            <span className="font-bold text-gray-900 dark:text-white block mb-1">
              2. רכישת נייר תחליפי
            </span>
            קנייה מידית של קרן או מניה מקבילה (למשל מקרן S&P של iShares לקרן של Invesco) כדי שהכסף לא יעמוד בצד ולא יפספס עליות.
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
            <span className="font-bold text-gray-900 dark:text-white block mb-1">
              3. זיכוי מס בחשבון
            </span>
            מגן המס מקזז מיידית מס רווחי הון ששולם על עסקאות אחרות השנה, או נשמר לקיזוז עתידי ללא הגבלת זמן.
          </div>
        </div>
      </div>
    </div>
  );
}
