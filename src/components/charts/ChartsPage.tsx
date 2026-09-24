'use client';

import { useChartData, type Period } from '@/hooks';
import { Card, Button, Select } from '@/components/ui';
import { PerformanceChart } from './PerformanceChart';
import { AllocationChart } from './AllocationChart';
import { SP500ComparisonChart } from './SP500ComparisonChart';

const periodOptions = [
  { value: '1mo', label: 'חודש אחרון' },
  { value: '3mo', label: '3 חודשים' },
  { value: '6mo', label: '6 חודשים' },
  { value: '1y', label: 'שנה' },
  { value: '2y', label: 'שנתיים' },
  { value: '5y', label: '5 שנים' },
];

export function ChartsPage() {
  const {
    performanceData,
    allocationData,
    isLoading,
    error,
    period,
    setPeriod,
    refresh,
  } = useChartData();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            options={periodOptions}
            className="w-40"
          />
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          {isLoading ? 'טוען...' : 'רענן נתונים'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card 
          title="ביצועי התיק לעומת S&P 500" 
          subtitle="תשואה מצטברת (נורמלי ל-100)"
        >
          <PerformanceChart data={performanceData} isLoading={isLoading} />
        </Card>

        {/* S&P 500 Comparison */}
        <Card 
          title="השוואה ל-S&P 500" 
          subtitle="תשואה באחוזים"
        >
          <SP500ComparisonChart data={performanceData} isLoading={isLoading} />
        </Card>

        {/* Allocation Chart */}
        <Card 
          title="התפלגות התיק" 
          subtitle="לפי שווי נוכחי"
        >
          <AllocationChart data={allocationData} isLoading={isLoading} />
        </Card>

        {/* Holdings Performance */}
        <Card 
          title="ביצועי אחזקות" 
          subtitle="רווח/הפסד לפי נכס"
        >
          <HoldingsPerformance data={allocationData} isLoading={isLoading} />
        </Card>
      </div>
    </div>
  );
}

// Simple bar-like list showing holdings performance
interface HoldingsPerformanceProps {
  data: Array<{
    symbol: string;
    name: string;
    currentValue: number;
    percentage: number;
    color: string;
  }>;
  isLoading?: boolean;
}

function HoldingsPerformance({ data, isLoading }: HoldingsPerformanceProps) {
  if (isLoading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">טוען נתונים...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="mb-2">אין נתונים להצגה</p>
          <p className="text-sm">יש להוסיף אחזקות כדי לראות את הביצועים</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.currentValue));

  return (
    <div className="space-y-3 max-h-[280px] overflow-y-auto">
      {data.map((item) => (
        <div key={item.symbol} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{item.symbol}</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-[120px]">
                {item.name}
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              ${item.currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.currentValue / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
