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
      className={`bg-white dark:bg-gray-900 rounded-3xl shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            {title && (
              <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
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
      className={`bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all flex flex-col justify-between ${className}`}
    >
      {/* Top Label */}
      <div className="text-xs font-bold text-gray-400 dark:text-gray-400 mb-3 flex items-center justify-between">
        <span>{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center shrink-0 text-sm">
            {icon}
          </div>
        )}
      </div>

      {/* Value & Info Row */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {subtitle}
            </div>
          )}
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl shrink-0 border ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40'
            }`}
          >
            <span>
              {trend.isPositive ? '+' : ''}
              {trend.value.toFixed(2)}%
            </span>
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
