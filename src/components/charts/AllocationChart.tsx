'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface AllocationData {
  symbol: string;
  name: string;
  currentValue: number;
  percentage: number;
  color: string;
}

interface AllocationChartProps {
  data: AllocationData[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function AllocationChart({ data, isLoading }: AllocationChartProps) {
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
          <p className="text-sm">יש להוסיף אחזקות כדי לראות את התפלגות התיק</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationData }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white">{item.name}</p>
          <p className="text-gray-300 text-sm">{item.symbol}</p>
          <p className="text-blue-400 font-medium mt-1">{formatCurrency(item.currentValue)}</p>
          <p className="text-gray-400 text-sm">{item.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4">
      <div className="w-full lg:w-1/2">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="currentValue"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full lg:w-1/2">
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {data.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 dark:text-gray-300">{item.symbol}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.percentage.toFixed(1)}%
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs mr-2">
                  ({formatCurrency(item.currentValue)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
