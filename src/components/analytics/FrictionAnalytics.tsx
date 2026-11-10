'use client';

import React from 'react';
import type { FeeAndTaxStats } from '@/lib/analytics/intelligence';
import { StatCard } from '@/components/ui';
import { Receipt, Coins, ShieldAlert, BarChart } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface FrictionAnalyticsProps {
  stats: FeeAndTaxStats;
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

export function FrictionAnalytics({ stats, isLoading }: FrictionAnalyticsProps) {
  const { maskAmount } = usePrivacy();

  if (isLoading) {
    return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        טוען ניתוח עמלות ומיסוי...
      </div>
    );
  }

  const years = Object.keys(stats.commissionsByYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="סה״כ עמלות ששולמו לברוקר"
          value={maskAmount(formatILS(stats.totalCommissionsILS))}
          subtitle="עמלות קנייה, מכירה ודמי טיפול מצטברים"
          icon={<Receipt className="w-5 h-5 text-rose-500" />}
        />
        <StatCard
          title="שחיקת עמלות מהתיק (Fee Drag)"
          value={`${stats.feeDragPercent}%`}
          subtitle="אחוז העמלות ביחס להיקף ההשקעות"
          trend={{ value: stats.feeDragPercent, isPositive: stats.feeDragPercent < 1 }}
          icon={<Coins className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="אומדן מס שנוכה במקור"
          value={maskAmount(formatILS(stats.totalTaxEstimateILS))}
          subtitle="ניכויי מס רווחי הון ודיבידנדים"
          icon={<ShieldAlert className="w-5 h-5 text-blue-500" />}
        />
      </div>

      {/* Breakdown by Year */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            עמלות ששולמו לפי שנה
          </h3>
        </div>

        <div className="space-y-3">
          {years.map((yr) => {
            const amount = stats.commissionsByYear[yr];
            const maxAmount = Math.max(...Object.values(stats.commissionsByYear), 1);
            const pct = Math.min(100, (amount / maxAmount) * 100);

            return (
              <div key={yr} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">שנת {yr}</span>
                  <span className="text-gray-900 dark:text-white">{maskAmount(formatILS(amount))}</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

