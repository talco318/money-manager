'use client';

import React, { useState } from 'react';
import { StressTestResult, StressTestScenario } from '@/lib/analytics/intelligence';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StressTestingProps {
  stats: StressTestResult;
  isLoading?: boolean;
}

export function StressTesting({ stats, isLoading }: StressTestingProps) {
  const { isPrivate } = usePrivacy();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    stats.scenarios[0]?.id || ''
  );
  const [filterCategory, setFilterCategory] = useState<'all' | 'historical' | 'macro' | 'bull'>('all');

  const formatILS = (val: number) => {
    if (isPrivate) return '•••• ₪';
    return `₪${Math.round(val).toLocaleString()}`;
  };

  const formatPercent = (val: number) => {
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(1)}%`;
  };

  const filteredScenarios = stats.scenarios.filter((s) => {
    if (filterCategory === 'all') return true;
    return s.category === filterCategory;
  });

  const selectedScenario = stats.scenarios.find((s) => s.id === selectedScenarioId) || stats.scenarios[0];

  const getSeverityBadge = (severity: StressTestScenario['severity']) => {
    switch (severity) {
      case 'severe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
            <Flame className="w-3 h-3" />
            קריסה עמוקה
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            זעזוע משמעותי
          </span>
        );
      case 'mild':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Zap className="w-3 h-3" />
            תנודתיות בינונית
          </span>
        );
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            ראלי שורי
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Portfolio Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold">שווי תיק נוכחי לבדיקה</span>
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {formatILS(stats.currentPortfolioValueILS)}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            בסיס החישוב לסימולציית זעזועים
          </p>
        </div>

        {/* Most Resilient Holding */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              הנכס העמיד ביותר במשברים
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {stats.mostResilientHolding ? stats.mostResilientHolding.symbol : 'קרן כספית / מדד'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
            {stats.mostResilientHolding?.name || 'הגנה מקסימלית'} • נפילה מינימלית
          </p>
        </div>

        {/* Most Vulnerable Holding */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              הנכס התנודתי ביותר (בטא גבוהה)
            </span>
            <Flame className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 truncate">
            {stats.mostVulnerableHolding ? stats.mostVulnerableHolding.symbol : 'מניות טכנולוגיה'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
            {stats.mostVulnerableHolding?.name || 'בטא גבוהה'} • ירידה מרבית:{' '}
            {stats.mostVulnerableHolding ? `${stats.mostVulnerableHolding.maxLossPercent}%` : '-'}
          </p>
        </div>

        {/* Total Stress Scenarios Tested */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              תרחישי קיצון מכוילים
            </span>
            <ShieldAlert className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {stats.scenarios.length} תרחישים
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            היסטוריים, מאקרו-כלכליים ומקומיים
          </p>
        </div>
      </div>

      {/* Summary Narrative Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
            תובנת חוסן תיק ומבנה הגנה
          </h4>
          <p className="text-xs text-blue-800/90 dark:text-blue-300/80 mt-1 leading-relaxed">
            {stats.summaryText}
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterCategory === 'all'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            כל התרחישים
          </button>
          <button
            onClick={() => setFilterCategory('historical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterCategory === 'historical'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            משברים היסטוריים
          </button>
          <button
            onClick={() => setFilterCategory('macro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterCategory === 'macro'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            זעזועי מאקרו ומט"ח
          </button>
          <button
            onClick={() => setFilterCategory('bull')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterCategory === 'bull'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            תרחיש שורי
          </button>
        </div>

        <p className="text-xs text-gray-400">
          בחר תרחיש כדי לראות את ההשפעה המדויקת על כל נייר ערך בתיק
        </p>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredScenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenario?.id;
          const isNegative = scenario.estimatedImpactILS < 0;

          return (
            <div
              key={scenario.id}
              onClick={() => setSelectedScenarioId(scenario.id)}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 text-right ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                {getSeverityBadge(scenario.severity)}
                <span className="text-[11px] text-gray-400">
                  {scenario.category === 'historical'
                    ? 'היסטורי'
                    : scenario.category === 'macro'
                    ? 'מאקרו / שקל'
                    : 'שוק עולה'}
                </span>
              </div>

              <h4 className="text-base font-black text-gray-900 dark:text-white mb-1">
                {scenario.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px] mb-4">
                {scenario.subtitle}
              </p>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">השפעה משוערת על התיק</span>
                  <span
                    className={`text-lg font-black ${
                      isNegative
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {formatILS(scenario.estimatedImpactILS)}
                  </span>
                </div>

                <div
                  className={`text-sm font-black px-2.5 py-1 rounded-xl ${
                    isNegative
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  }`}
                >
                  {formatPercent(scenario.estimatedImpactPercent)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Scenario Deep-Dive Section */}
      {selectedScenario && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  ניתוח עומק: {selectedScenario.title}
                </h3>
                {getSeverityBadge(selectedScenario.severity)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedScenario.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 rounded-xl self-start sm:self-auto">
              <div>
                <span className="text-[10px] text-gray-400 block">שווי תיק לאחר התרחיש</span>
                <span className="text-base font-black text-gray-900 dark:text-white">
                  {formatILS(selectedScenario.projectedPortfolioValueILS)}
                </span>
              </div>
              <div className="h-7 w-[1px] bg-gray-200 dark:bg-gray-700" />
              <div>
                <span className="text-[10px] text-gray-400 block">שיעור שינוי</span>
                <span
                  className={`text-base font-black ${
                    selectedScenario.estimatedImpactILS < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatPercent(selectedScenario.estimatedImpactPercent)}
                </span>
              </div>
            </div>
          </div>

          {/* Key Takeaway Box */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                מסקנה אסטרטגית מהסימולציה
              </h5>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                {selectedScenario.keyTakeaway}
              </p>
            </div>
          </div>

          {/* Holding-by-Holding Impact Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
              השפעה מפורטת לפי נכסים בתיק
            </h4>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60 text-gray-400 font-semibold">
                    <th className="py-2.5 px-3">נכס / נייר ערך</th>
                    <th className="py-2.5 px-3">שווי נוכחי</th>
                    <th className="py-2.5 px-3">שווי חזוי בתרחיש</th>
                    <th className="py-2.5 px-3">שינוי בש"ח</th>
                    <th className="py-2.5 px-3 text-left">שינוי באחוזים</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {selectedScenario.holdingImpacts.map((holding) => {
                    const isDrop = holding.impactILS < 0;
                    return (
                      <tr
                        key={holding.symbol}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {holding.symbol}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[180px]">
                            {holding.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                          {formatILS(holding.currentValueILS)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                          {formatILS(holding.projectedValueILS)}
                        </td>
                        <td
                          className={`py-3 px-3 font-bold ${
                            isDrop
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatILS(holding.impactILS)}
                        </td>
                        <td className="py-3 px-3 text-left">
                          <span
                            className={`inline-block font-black px-2 py-0.5 rounded-md text-[11px] ${
                              isDrop
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}
                          >
                            {formatPercent(holding.impactPercent)}
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
      )}
    </div>
  );
}
