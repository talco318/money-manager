'use client';

import React, { useState } from 'react';
import type { PositionLifecycle } from '@/lib/analytics/intelligence';
import { Card } from '@/components/ui';
import { Search, TrendingUp, TrendingDown, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface PositionsHistoryProps {
  positions: PositionLifecycle[];
  isLoading: boolean;
}

function formatILS(val: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function PositionsHistory({ positions, isLoading }: PositionsHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'closed' | 'open'>('all');
  const [search, setSearch] = useState('');
  const { maskAmount } = usePrivacy();

  if (isLoading) {
    return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        טוען היסטוריית פוזיציות ורווחים ממומשים...
      </div>
    );
  }

  const filtered = positions.filter((pos) => {
    if (filter === 'closed' && pos.isOpen) return false;
    if (filter === 'open' && !pos.isOpen) return false;
    if (search) {
      const q = search.toLowerCase();
      return pos.symbol.toLowerCase().includes(q) || pos.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי נייר או חברה (למשל: NVDA, גוגל, ATF)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            הכל ({positions.length})
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'closed'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            סגורות בלבד ({positions.filter((p) => !p.isOpen).length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'open'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            פעילות בלבד ({positions.filter((p) => p.isOpen).length})
          </button>
        </div>
      </div>

      {/* Positions Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-gray-500">
          לא נמצאו פוזיציות התואמות לחיפוש
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((pos) => {
            const isProfit = pos.netRealizedProfitILS >= 0;
            return (
              <div
                key={pos.symbol}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/60 shadow-xs flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              >
                <div>
                  {/* Top Bar: Symbol, Status & Holding period */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-wide">
                          {pos.symbol}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            pos.isOpen
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {pos.isOpen ? '🟢 פוזיציה פעילה' : '⚪ פוזיציה סגורה'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {pos.name}
                      </p>
                    </div>

                    {/* Realized Profit Pill */}
                    <div className="text-left shrink-0">
                      <span
                        className={`text-sm font-extrabold block ${
                          isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {maskAmount(formatILS(pos.netRealizedProfitILS))}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {pos.realizedPnLPercent >= 0 ? '+' : ''}
                        {pos.realizedPnLPercent.toFixed(1)}% רווח ממומש
                      </span>
                    </div>
                  </div>

                  {/* Lifecycle Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-xs mb-3">
                    <div>
                      <span className="text-gray-400 block text-[10px]">תקופת החזקה</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {pos.holdingDays} ימים
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">מחיר קנייה ממוצע</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 block mt-0.5">
                        {pos.currency === 'USD' ? '$' : '₪'}
                        {maskAmount(pos.avgBuyPrice.toString())}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">מחיר מכירה ממוצע</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 block mt-0.5">
                        {pos.avgSellPrice > 0 ? `${pos.currency === 'USD' ? '$' : '₪'}${maskAmount(pos.avgSellPrice.toString())}` : '---'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Paper Hands Insight (What if I hadn't sold?) */}
                {!pos.isOpen && pos.paperHandsDiffILS !== undefined && (
                  <div
                    className={`p-2.5 rounded-xl text-xs border flex items-center gap-2 ${
                      pos.paperHandsDiffILS > 0
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                        : 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <div>
                      {pos.paperHandsDiffILS > 0 ? (
                        <span>
                          <strong>תובנת תזמון:</strong> המניה עלתה ל-
                          {pos.currentPrice ? `$${pos.currentPrice}` : ''} לאחר המכירה (פספוס של עוד{' '}
                          {maskAmount(formatILS(pos.paperHandsDiffILS))}).
                        </span>
                      ) : (
                        <span>
                          <strong>תזמון מצוין:</strong> המניה ירדה ל-
                          {pos.currentPrice ? `$${pos.currentPrice}` : ''} לאחר שמכרת (נמנע הפסד של{' '}
                          {maskAmount(formatILS(Math.abs(pos.paperHandsDiffILS)))}).
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

