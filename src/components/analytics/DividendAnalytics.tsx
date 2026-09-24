'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';
import type { DividendAnalytics as DividendData } from '@/hooks';

interface DividendAnalyticsProps {
  data: DividendData | null;
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

export function DividendAnalytics({ data, isLoading }: DividendAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <span className="text-5xl block mb-4">💵</span>
        <p className="text-lg mb-2">אין נתוני דיבידנדים</p>
        <p className="text-sm">דיבידנדים יופיעו כאן אחרי ייבוא עסקאות</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">סה״כ דיבידנדים</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            {formatCurrency(data.total)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">מס שנוכה</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
            {formatCurrency(data.totalTax)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">נטו לאחר מס</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {formatCurrency(data.netTotal)}
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      {chartData.length > 0 && (
        <Card title="דיבידנדים לפי חודש">
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
                formatter={(value) => [formatCurrency(Number(value)), 'דיבידנד']}
              />
              <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* By Symbol Table */}
      {data.bySymbol.length > 0 && (
        <Card title="דיבידנדים לפי נייר">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">נייר</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">תשלומים</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {data.bySymbol.map((item) => (
                  <tr key={item.symbol} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{item.symbol}</span>
                        {item.name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{item.count}</td>
                    <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
