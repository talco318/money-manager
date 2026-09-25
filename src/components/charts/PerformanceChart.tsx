'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceDataPoint {
  date: string;
  portfolio: number;
  sp500: number;
  portfolioReturn: number;
  sp500Return: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  isLoading?: boolean;
}

export function PerformanceChart({ data, isLoading }: PerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">טוען נתונים...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="mb-2">אין נתונים להצגה</p>
          <p className="text-sm">יש להוסיף עסקאות כדי לראות את ביצועי התיק</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickLine={{ stroke: '#4B5563' }}
          axisLine={{ stroke: '#4B5563' }}
        />
        <YAxis 
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickLine={{ stroke: '#4B5563' }}
          axisLine={{ stroke: '#4B5563' }}
          tickFormatter={(value) => `\u200E${value >= 0 ? '+' : ''}${value.toFixed(0)}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB',
          }}
          formatter={(value, name) => [
            `\u200E${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`,
            name === 'portfolioReturn' ? 'התיק שלי' : 'S&P 500'
          ]}
          labelStyle={{ color: '#9CA3AF' }}
        />
        <Legend 
          formatter={(value) => value === 'portfolioReturn' ? 'התיק שלי' : 'מדד S&P 500'}
          wrapperStyle={{ paddingTop: '10px' }}
        />
        <Line 
          type="monotone" 
          dataKey="portfolioReturn" 
          name="portfolioReturn"
          stroke="#3B82F6" 
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, fill: '#3B82F6' }}
        />
        <Line 
          type="monotone" 
          dataKey="sp500Return" 
          name="sp500Return"
          stroke="#10B981" 
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 6, fill: '#10B981' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
