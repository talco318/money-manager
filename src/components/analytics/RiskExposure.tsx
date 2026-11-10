'use client';

import React from 'react';
import type { TrueExposureStats } from '@/lib/analytics/intelligence';
import { Globe, Flag, PieChart, Shield } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface RiskExposureProps {
  stats: TrueExposureStats;
  isLoading: boolean;
}

function formatILS(val: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function RiskExposure({ stats, isLoading }: RiskExposureProps) {
  const { maskAmount } = usePrivacy();

  if (isLoading) {
    return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        טוען ניתוח חשיפות מטבע וריכוזיות...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Currency & Geographic Exposure Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            חשיפה כלכלית אמיתית (מטבעות ושווקים)
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          משקלל מניות זרות וקרנות ישראליות שמחקות מדדי חו״ל (כמו S&amp;P 500 ו-MSCI ACWI) כנכסים גלובליים
        </p>

        {/* Visual Bar */}
        <div className="h-6 w-full bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden flex mb-4">
          <div
            style={{ width: `${stats.foreignGlobalPercent}%` }}
            className="bg-blue-600 dark:bg-blue-500 h-full flex items-center justify-center text-[11px] font-extrabold text-white"
          >
            {stats.foreignGlobalPercent > 15 ? `${stats.foreignGlobalPercent}% ארה״ב וגלובלי` : ''}
          </div>
          <div
            style={{ width: `${stats.domesticIsraelPercent}%` }}
            className="bg-indigo-400 dark:bg-indigo-600 h-full flex items-center justify-center text-[11px] font-extrabold text-white"
          >
            {stats.domesticIsraelPercent > 10 ? `${stats.domesticIsraelPercent}% ישראל` : ''}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                גלובלי וארה״ב (צמוד דולר)
              </span>
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {stats.foreignGlobalPercent}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {maskAmount(formatILS(stats.foreignGlobalValueILS))}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-indigo-400 dark:bg-indigo-600" />
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                כלכלת ישראל (שקל מקומי)
              </span>
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {stats.domesticIsraelPercent}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {maskAmount(formatILS(stats.domesticIsraelValueILS))}
            </p>
          </div>
        </div>
      </div>

      {/* Concentration Risk */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            מדד ריכוזיות (5 האחזקות הגדולות ביותר בתיק)
          </h3>
        </div>

        <div className="space-y-3.5">
          {stats.topHoldingsConcentration.map((h, idx) => (
            <div key={h.symbol} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="text-gray-400 text-[10px]">#{idx + 1}</span>
                  {h.symbol} • <span className="font-normal text-gray-500">{h.name}</span>
                </span>
                <span className="text-gray-900 dark:text-white">
                  {h.weightPercent}% ({maskAmount(formatILS(h.valueILS))})
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 dark:bg-purple-400 rounded-full"
                  style={{ width: `${Math.min(100, h.weightPercent * 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

