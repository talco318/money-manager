'use client';

import React, { useState } from 'react';
import type { WealthProjectionStats } from '@/lib/analytics/intelligence';
import { Rocket, Sparkles, TrendingUp, PiggyBank } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface WealthSimulatorProps {
  stats: WealthProjectionStats;
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

export function WealthSimulator({ stats, isLoading }: WealthSimulatorProps) {
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(stats.monthlyDepositAvgILS || 5000);
  const [annualReturn, setAnnualReturn] = useState<number>(8); // 8% default
  const { maskAmount } = usePrivacy();

  if (isLoading) {
    return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        טוען סימולטור צמיחה ועושר...
      </div>
    );
  }

  const startValue = stats.currentValueILS || 270000;

  // Calculate projection for N years
  const calculateProjection = (years: number) => {
    let current = startValue;
    const r = annualReturn / 100 / 12;
    let totalDeposited = startValue;

    for (let m = 1; m <= years * 12; m++) {
      current = current * (1 + r) + monthlyDeposit;
      totalDeposited += monthlyDeposit;
    }

    const compoundProfit = Math.max(0, current - totalDeposited);
    return {
      years,
      totalValue: Math.round(current),
      totalDeposited: Math.round(totalDeposited),
      compoundProfit: Math.round(compoundProfit),
    };
  };

  const projections = [3, 5, 10, 20].map(calculateProjection);

  return (
    <div className="space-y-6">
      {/* Interactive Controls Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            סימולטור צמיחה אינטראקטיבי (ריבית דריבית)
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          מבוסס על שווי התיק הנוכחי שלך ({maskAmount(formatILS(startValue))}) וקצב הפקדה חודשי לבחירתך
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl">
          {/* Monthly Deposit Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-700 dark:text-gray-300">הפקדה חודשית נוספת:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                {maskAmount(formatILS(monthlyDeposit))}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30000"
              step="500"
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>₪0</span>
              <span>₪15,000</span>
              <span>₪30,000</span>
            </div>
          </div>

          {/* Expected Annual Return Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-700 dark:text-gray-300">תשואה שנתית צפויה:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                {annualReturn}% לשנה
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>3% (שמרני)</span>
              <span>8% (מדד עולמי ממוצע)</span>
              <span>15% (אגרסיבי)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {projections.map((proj) => (
          <div
            key={proj.years}
            className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/60 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                  בעוד {proj.years} שנים
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>

              <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                {maskAmount(formatILS(proj.totalValue))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                שווי כולל צפוי לתיק
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>קרן שהופקדה:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {maskAmount(formatILS(proj.totalDeposited))}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>רווח מריבית דריבית:</span>
                <span>+{maskAmount(formatILS(proj.compoundProfit))}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

