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
          <p className={`text-lg font-bold font-mono ${portfolioReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <span dir="ltr" className="inline-block">
              {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
            </span>
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">S&P 500</p>
          <p className={`text-lg font-bold font-mono ${sp500Return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <span dir="ltr" className="inline-block">
              {sp500Return >= 0 ? '+' : ''}{sp500Return.toFixed(2)}%
            </span>
          </p>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">אלפא (הפרש)</p>
          <p className={`text-lg font-bold font-mono ${alpha >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <span dir="ltr" className="inline-block">
              {alpha >= 0 ? '+' : ''}{alpha.toFixed(2)}%
            </span>
          </p>
        </div>
      </div>

      {/* Area Chart showing Alpha (excess return over S&P 500) */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={dataWithAlpha} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="alphaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={alpha >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0.4} />
              <stop offset="95%" stopColor={alpha >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
            tickFormatter={(value) => `\u200E${value >= 0 ? '+' : ''}${value.toFixed(0)}%`}
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
                portfolioReturn: 'תשואת התיק',
                sp500Return: 'תשואת S&P 500',
                alpha: 'אלפא (עודף תשואה)',
              };
              const num = Number(value);
              return [`\u200E${num >= 0 ? '+' : ''}${num.toFixed(2)}%`, labels[String(name)] || name];
            }}
          />
          <Area
            type="monotone"
            dataKey="alpha"
            name="alpha"
            stroke={alpha >= 0 ? '#10B981' : '#EF4444'}
            fill="url(#alphaGradient)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
