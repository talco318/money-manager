'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceDataPoint {
  date: string;
  portfolioReturn: number;
  sp500Return: number;
}

interface SP500ComparisonChartProps {
  data: PerformanceDataPoint[];
  isLoading?: boolean;
}

export function SP500ComparisonChart({ data, isLoading }: SP500ComparisonChartProps) {
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
          <p className="text-sm">נתוני S&P 500 יופיעו כאן</p>
        </div>
      </div>
    );
  }

  // Calculate the difference (alpha)
  const dataWithAlpha = data.map(point => ({
    ...point,
    alpha: point.portfolioReturn - point.sp500Return,
  }));

  const lastPoint = dataWithAlpha[dataWithAlpha.length - 1];
  const portfolioReturn = lastPoint?.portfolioReturn || 0;
  const sp500Return = lastPoint?.sp500Return || 0;
  const alpha = portfolioReturn - sp500Return;

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">התיק שלי</p>
          <p className={`text-lg font-bold ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">S&P 500</p>
          <p className={`text-lg font-bold ${sp500Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {sp500Return >= 0 ? '+' : ''}{sp500Return.toFixed(2)}%
          </p>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">אלפא (הפרש)</p>
          <p className={`text-lg font-bold ${alpha >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {alpha >= 0 ? '+' : ''}{alpha.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Area Chart showing the difference */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={dataWithAlpha} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={{ stroke: '#4B5563' }}
            axisLine={{ stroke: '#4B5563' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={{ stroke: '#4B5563' }}
            axisLine={{ stroke: '#4B5563' }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                portfolioReturn: 'התיק שלי',
                sp500Return: 'S&P 500',
                alpha: 'אלפא',
              };
              return [`${Number(value).toFixed(2)}%`, labels[String(name)] || name];
            }}
          />
          <Area
            type="monotone"
            dataKey="sp500Return"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="portfolioReturn"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
