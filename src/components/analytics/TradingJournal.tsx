'use client';

import React from 'react';
import type { TradingStats } from '@/lib/analytics/intelligence';
import { StatCard } from '@/components/ui';
import { Trophy, AlertTriangle, Target, Zap, Clock, TrendingUp } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface TradingJournalProps {
  stats: TradingStats;
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

export function TradingJournal({ stats, isLoading }: TradingJournalProps) {
  const { maskAmount } = usePrivacy();

  if (isLoading) {
    return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        טוען יומן עסקאות וסטטיסטיקות הצלחה...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="שיעור הצלחה (Win Rate)"
          value={`${stats.winRatePercent}%`}
          subtitle={`${stats.winningPositionsCount} מנצחות מתוך ${stats.closedPositionsCount} פוזיציות`}
          trend={{ value: stats.winRatePercent, isPositive: stats.winRatePercent >= 50 }}
          icon={<Target className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="סך רווח ממומש בפועל"
          value={maskAmount(formatILS(stats.totalRealizedProfitILS))}
          subtitle="רווחי עבר שמומשו לכיס"
          trend={{ value: stats.totalRealizedProfitILS, isPositive: stats.totalRealizedProfitILS >= 0 }}
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="יחס רווח/הפסד (Profit Factor)"
          value={`${stats.profitFactor}`}
          subtitle={stats.profitFactor >= 2 ? 'מצוין (רווחים פי 2+ מההפסדים)' : 'סביר (איזון סיכוי/סיכון)'}
          trend={{ value: stats.profitFactor, isPositive: stats.profitFactor >= 1.5 }}
          icon={<Zap className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="זמן החזקה ממוצע"
          value={`${stats.avgHoldingDays} ימים`}
          subtitle="משך ממוצע של פוזיציה"
          icon={<Clock className="w-5 h-5 text-purple-500" />}
        />
      </div>

      {/* Top Winner & Biggest Loss Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Winner */}
        {stats.topWinner && (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10 rounded-3xl p-6 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-amber-500" />
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                העסקה הכי רווחית אי פעם (Top Winner)
              </h3>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {stats.topWinner.symbol}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {stats.topWinner.name}
                </p>
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  +{maskAmount(formatILS(stats.topWinner.profitILS))}
                </p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  +{stats.topWinner.profitPercent.toFixed(1)}% תשואה
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Biggest Loss */}
        {stats.biggestLoss && (
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/40 dark:from-rose-950/30 dark:to-rose-900/10 rounded-3xl p-6 border border-rose-200/60 dark:border-rose-800/40 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">
                ההפסד הגדול ביותר שמומש (Biggest Loss)
              </h3>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {stats.biggestLoss.symbol}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {stats.biggestLoss.name}
                </p>
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  -{maskAmount(formatILS(stats.biggestLoss.lossILS))}
                </p>
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  {stats.biggestLoss.lossPercent.toFixed(1)}% מההשקעה
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

