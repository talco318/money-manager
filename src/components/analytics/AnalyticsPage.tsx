'use client';

import { useState } from 'react';
import { useAnalytics } from '@/hooks';
import { Button, Select } from '@/components/ui';
import { DividendAnalytics } from './DividendAnalytics';
import { CommissionAnalytics } from './CommissionAnalytics';

type Tab = 'dividends' | 'commissions';

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: '', label: 'כל השנים' },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dividends');
  const { dividends, commissions, isLoading, error, year, setYear, refresh } = useAnalytics();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setActiveTab('dividends')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dividends'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            💵 דיבידנדים
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'commissions'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            💸 עמלות
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={yearOptions}
            className="w-32"
          />
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            {isLoading ? 'טוען...' : 'רענן'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Content */}
      {activeTab === 'dividends' ? (
        <DividendAnalytics data={dividends} isLoading={isLoading} />
      ) : (
        <CommissionAnalytics data={commissions} isLoading={isLoading} />
      )}
    </div>
  );
}
