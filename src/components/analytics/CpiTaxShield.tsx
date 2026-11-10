'use client';

import React, { useState } from 'react';
import { CpiTaxShieldResult } from '@/lib/analytics/intelligence';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Percent,
  Calendar,
  Sparkles,
  Zap,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

interface CpiTaxShieldProps {
  stats: CpiTaxShieldResult;
  isLoading?: boolean;
}

export function CpiTaxShield({ stats, isLoading }: CpiTaxShieldProps) {
  const { isPrivate } = usePrivacy();
  const [simulatedCpiHike, setSimulatedCpiHike] = useState<number>(0.5); // +0.5% default simulation
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const formatILS = (val: number) => {
    if (isPrivate) return '•••• ₪';
    return `₪${Math.round(val).toLocaleString()}`;
  };

  const formatPercent = (val: number) => {
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(2)}%`;
  };

  // Simulation calculations
  const simulatedLots = stats.lots.map((lot) => {
    const simCpi = lot.currentCpi * (1 + simulatedCpiHike / 100);
    const simAdjCost = lot.costILS * (simCpi / lot.baseCpi);
    const simRealGain = lot.currentValueILS - simAdjCost;
    const simShield = simRealGain < 0 ? Math.abs(simRealGain) * 0.25 : 0;
    return {
      ...lot,
      simCpi,
      simRealGain,
      simShield,
    };
  });

  const totalSimulatedShield = simulatedLots.reduce((acc, l) => acc + l.simShield, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Created Tax Shield */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              מגן מס זמין לקיזוז מניות
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatILS(stats.totalTaxShieldAvailableILS)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>מקזז 25% מס רווחי הון ממניות ו-ETF</span>
          </div>
        </div>

        {/* Nominal Cash Gains Locked */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              רווח שקלי נומינלי לכיס
            </span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {formatILS(stats.totalNominalGainsLockedILS)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            <span>חבות מס בפועל: 0 ₪ (פטור מלא!)</span>
          </div>
        </div>

        {/* Direct Tax Saved */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              חיסכון מס ישיר מאיפוס
            </span>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {formatILS(stats.totalTaxSavedILS)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>מס נומינלי שנחסך במלואו</span>
          </div>
        </div>

        {/* Next CPI Release Date */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              פרסום מדד המחירים הבא
            </span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            בעוד {stats.daysUntilNextCpi} ימים
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {stats.nextCpiReleaseDate}
          </p>
        </div>
      </div>

      {/* Hero Arbitrage Opportunity Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-amber-300 border border-white/20 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current" />
                הזדמנות ארביטראז' מס פעילה כעת
              </span>
              <span className="text-xs text-white/80">
                מדד בסיס vs מדד עדכני: {stats.latestCpiValue}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tight">
              מכור וקנה מחדש את הקרן הכספית: נעל רווח שקלי, שלם 0 ₪ מס, וקבל מגן מס!
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              שיעור עליית מדד המחירים לצרכן עקף את תשואת הקרן בתקופת ההחזקה. פעולת Wash Sale חוקית במיטב טרייד תקבע לך את הרווח השקלי במזומן, עם אפס אחוז מס, ותייצר מגן מס רשמי שיקזז לך מס מרווחי מניות.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] text-emerald-200 block mb-1">
              שווי מגן המס לייצור מיידי
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white block">
              {formatILS(stats.totalTaxShieldAvailableILS)}
            </span>
            <span className="text-[10px] text-emerald-100 block mt-1">
              ב-0 ₪ עלות עמלה או מס
            </span>
          </div>
        </div>
      </div>

      {/* Lots Breakdown Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>מעקב Lots בקרנות כספיות לפי מדד רלוונטי</span>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                title="כיצד עובד המיסוי הריאלי?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              השוואת מדד הרכישה למדד הנוכחי מול תשואת הקרן
            </p>
          </div>

          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold self-start sm:self-auto">
            {stats.activeOpportunitiesCount} עסקאות עם ארביטראז' פעיל
          </span>
        </div>

        {showExplanation && (
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed space-y-2 animate-in fade-in">
            <p className="font-bold">📘 סעיף 91 לפקודת מס הכנסה (מיסוי ריאלי):</p>
            <p>
              קרן כספית שקלית פטורה ממוסית בשיעור 25% על <strong>הרווח הריאלי</strong> בלבד. כלומר: מחיר הקנייה מוצמד למדד המחירים לצרכן.
            </p>
            <p>
              אם הקרן הניבה למשל 1.5% רווח, אך המדד עלה ב-1.9%, נוצר <strong>הפסד הון ריאלי של 0.4%-</strong>. מס הכנסה רואה בזה הפסד, ומאפשר לקזז אותו כנגד רווחים ממניות (למשל מניות S&P 500 או דיבידנדים)!
            </p>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60 text-gray-400 font-semibold">
                <th className="py-2.5 px-3">קרן כספית / נייר</th>
                <th className="py-2.5 px-3">תאריך רכישה</th>
                <th className="py-2.5 px-3">עלות מקור</th>
                <th className="py-2.5 px-3">שווי נוכחי</th>
                <th className="py-2.5 px-3">תשואה נומינלית</th>
                <th className="py-2.5 px-3">עליית המדד</th>
                <th className="py-2.5 px-3">רווח/הפסד ריאלי</th>
                <th className="py-2.5 px-3">חבות מס</th>
                <th className="py-2.5 px-3 text-left">מגן מס שנוצר</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {stats.lots.map((lot) => {
                return (
                  <tr
                    key={lot.id}
                    className={`transition-colors ${
                      lot.isArbitrageActive
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/60'
                        : 'hover:bg-gray-50/50 dark:hover:bg-gray-750/30'
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>{lot.symbol}</span>
                        {lot.isArbitrageActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            ארביטראז' ⚡
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[170px]">
                        {lot.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300 font-medium">
                      {lot.buyDate} ({lot.holdingDays} ימים)
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-gray-800 dark:text-gray-200">
                      {formatILS(lot.costILS)}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-gray-900 dark:text-white">
                      {formatILS(lot.currentValueILS)}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                      {formatPercent(lot.nominalReturnPercent)}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                      {formatPercent(lot.cpiChangePercent)}
                    </td>

                    <td
                      className={`py-3.5 px-3 font-black ${
                        lot.realGainLossILS < 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {formatPercent(lot.realReturnPercent)} ({formatILS(lot.realGainLossILS)})
                    </td>

                    <td className="py-3.5 px-3">
                      {lot.taxOwedILS === 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          0 ₪ (פטור!)
                        </span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400 font-bold">
                          {formatILS(lot.taxOwedILS)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-left">
                      {lot.isArbitrageActive ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs">
                          +{formatILS(lot.createdTaxShieldILS)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          אין מגן
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive What-If CPI Simulator */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900 dark:text-white">
                סימולטור "מה יקרה במדד הבא ב-15 לחודש?"
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                בדוק כיצד עליית מדד המחירים לצרכן מגדילה את מגן המס שלך
              </p>
            </div>
          </div>

          <div className="text-left">
            <span className="text-[10px] text-gray-400 block">מגן מס חזוי בתרחיש</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatILS(totalSimulatedShield)}
            </span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-700 dark:text-gray-300">
              שיעור עליית מדד משוערת: <span className="text-blue-600 dark:text-blue-400 text-sm">+{simulatedCpiHike.toFixed(2)}%</span>
            </span>
            <span className="text-gray-400">
              מדד יעד: {(stats.latestCpiValue * (1 + simulatedCpiHike / 100)).toFixed(2)} נקודות
            </span>
          </div>

          <input
            type="range"
            min={0.1}
            max={1.8}
            step={0.05}
            value={simulatedCpiHike}
            onChange={(e) => setSimulatedCpiHike(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-gray-400 pt-1">
            <span>מדד נמוך (+0.1%)</span>
            <span>מדד ממוצע (+0.5%)</span>
            <span>מדד קיץ גבוה (+1.2% - +1.8%)</span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Execution Blueprint */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-4">
        <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>מדריך ביצוע צעד-אחר-צעד במיטב טרייד (Execution Blueprint)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {stats.stepByStepGuide.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
