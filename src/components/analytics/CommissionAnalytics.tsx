'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui';
import type { CommissionAnalytics as CommissionData } from '@/hooks';

interface CommissionAnalyticsProps {
  data: CommissionData | null;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
}

export function CommissionAnalytics({ data, isLoading }: CommissionAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.transactionCount === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <span className="text-5xl block mb-4">💸</span>
        <p className="text-lg mb-2">אין נתוני עמלות</p>
        <p className="text-sm">עמלות יופיעו כאן אחרי ייבוא עסקאות</p>
      </div>
    );
  }

  const chartData = data.byMonth.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">סה״כ עמלות</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
            {formatCurrency(data.totalCommissions)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">עמלות נלוות</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
            {formatCurrency(data.totalFees)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">סה״כ עלויות</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
            {formatCurrency(data.grandTotal)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">ממוצע לעסקה</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">
            {formatCurrency(data.avgPerTransaction)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            מתוך {data.transactionCount} עסקאות
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      {chartData.length > 0 && (
        <Card title="עמלות לפי חודש">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickLine={{ stroke: '#4B5563' }}
                axisLine={{ stroke: '#4B5563' }}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickLine={{ stroke: '#4B5563' }}
                axisLine={{ stroke: '#4B5563' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                }}
                formatter={(value, name) => [
                  formatCurrency(Number(value)), 
                  name === 'commission' ? 'עמלת מסחר' : 'עמלות נלוות'
                ]}
              />
              <Legend 
                formatter={(value) => value === 'commission' ? 'עמלת מסחר' : 'עמלות נלוות'}
              />
              <Bar dataKey="commission" fill="#EF4444" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="fees" fill="#F97316" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Summary Info */}
      <Card title="סיכום">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">פירוט עמלות</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">עמלות מסחר</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(data.totalCommissions)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">עמלות נלוות</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(data.totalFees)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 font-medium">
                <span className="text-gray-900 dark:text-white">סה״כ</span>
                <span className="text-red-600 dark:text-red-400">
                  {formatCurrency(data.grandTotal)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">סטטיסטיקות</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">מספר עסקאות</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.transactionCount}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">עמלה ממוצעת לעסקה</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(data.avgPerTransaction)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">חודשים פעילים</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {data.byMonth.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
