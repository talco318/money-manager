'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, TrendingDown } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/60 overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            {title && (
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-700/60 hover:shadow-md transition-all flex flex-col justify-between ${className}`}
    >
      {/* Top Label */}
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
        {title}
      </div>

      {/* Value & Info Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-full bg-black dark:bg-gray-900 text-white flex items-center justify-center shrink-0 shadow-xs text-sm">
              {icon}
            </div>
          )}
          <div>
            <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {value}
            </div>
            {subtitle && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 px-2.5 py-1 rounded-lg shrink-0 border border-gray-100 dark:border-gray-700/50">
            <span>
              {trend.isPositive ? '+' : '-'}
              {Math.abs(trend.value).toFixed(2)}%
            </span>
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
