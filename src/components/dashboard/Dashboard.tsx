'use client';

import Link from 'next/link';
import { usePortfolio } from '@/hooks';
import { StatCard, Card, Button } from '@/components/ui';
import { HoldingsTable } from './HoldingsTable';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';

function formatCurrency(value: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat(currency === 'ILS' ? 'he-IL' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function Dashboard() {
  const { holdings, summary, usdIlsRate, isLoading, error, refresh, lastUpdated } = usePortfolio();
  const { isPrivate, togglePrivacy, maskAmount } = usePrivacy();

  const totalValue = summary?.totalValue || 0;
  const totalValueILS = summary?.totalValueILS || 0;
  const totalPnL = summary?.totalPnL || 0;
  const totalPnLILS = summary?.totalPnLILS ?? (totalPnL * usdIlsRate);
  const totalPnLPercent = summary?.totalPnLPercent || 0;
  const netDepositsILS = summary?.netDepositsILS || 0;
  const dayChange = summary?.dayChange || 0;
  const dayChangePercent = summary?.dayChangePercent || 0;
  const cashBalanceILS = summary?.cashBalanceILS || 0;
  const cashBalanceUSD = summary?.cashBalanceUSD || 0;
  const totalCashILS = summary?.totalCashILS || (cashBalanceILS + (cashBalanceUSD * usdIlsRate));

  const isProfitable = totalPnLILS >= 0;
  const isDayPositive = dayChange >= 0;

  const fmt = (val: number, cur: string = 'USD') => maskAmount(formatCurrency(val, cur));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">דשבורד</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">סקירה כללית של תיק ההשקעות שלך</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Mode Toggle */}
          <button
            onClick={togglePrivacy}
            className="px-3 py-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title={isPrivate ? "בטל מצב פרטיות" : "הפעל מצב פרטיות (הסתרת סכומים)"}
          >
            {isPrivate ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPrivate ? "חשוף סכומים" : "מצב פרטיות"}</span>
          </button>

          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:inline">
              עודכן: {lastUpdated.toLocaleTimeString('he-IL')}
            </span>
          )}
          <Button 
            onClick={refresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="rounded-xl text-xs font-semibold"
          >
            {isLoading ? 'טוען...' : 'רענן נתונים'}
          </Button>
        </div>
      </div>

      {/* Financial Intelligence Shortcut Banner */}
      <Link
        href="/analytics"
        className="block p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xs hover:shadow-md hover:scale-[1.005] transition-all"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">מודיעין ותובנות פיננסיות</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-gray-900">חדש!</span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5 line-clamp-1">
                בדוק מה החזקת בעבר, רווח ממומש לכיס, שיעור הצלחה, סימולטור &quot;מה אם לא הייתי מוכר?&quot; ועוד
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md flex items-center gap-1 shrink-0">
            <span>צפה</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="שווי התיק"
          value={isLoading ? '---' : fmt(totalValueILS, 'ILS')}
          subtitle={isLoading ? '---' : fmt(totalValue, 'USD')}
          icon={<span className="text-2xl">💰</span>}
        />
        <StatCard
          title="רווח/הפסד כולל"
          value={isLoading ? '---' : fmt(totalPnLILS, 'ILS')}
          subtitle={
            isLoading
              ? '---'
              : netDepositsILS > 0
                ? `${fmt(totalPnL, 'USD')} • הפקדות נטו: ${fmt(netDepositsILS, 'ILS')}`
                : fmt(totalPnL, 'USD')
          }
          trend={isLoading ? undefined : { value: totalPnLPercent, isPositive: isProfitable }}
          icon={<span className="text-2xl">{isProfitable ? '📈' : '📉'}</span>}
        />
        <StatCard
          title="שינוי יומי"
          value={isLoading ? '---' : `${isDayPositive ? '+' : ''}${fmt(dayChange * usdIlsRate, 'ILS')}`}
          subtitle={isLoading ? '---' : `${isDayPositive ? '+' : ''}${fmt(dayChange, 'USD')}`}
          trend={isLoading ? undefined : { value: dayChangePercent, isPositive: isDayPositive }}
          icon={<span className="text-2xl">{isDayPositive ? '🟢' : '🔴'}</span>}
        />
        <StatCard
          title="מספר אחזקות"
          value={isLoading ? '---' : holdings.length.toString()}
          subtitle={isLoading ? '---' : 'מניות וקרנות סל פעילות'}
          icon={<span className="text-2xl">📊</span>}
        />
      </div>

      {/* Cash Balances Section - Styled with Figma Card Aesthetic */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💳</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">יתרות מזומן בחשבון (מיטב טרייד)</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              יתרות המזומן הזמינות לפעילות, משוקללות בתוך שווי התיק הכולל
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* ILS Cash */}
            <div className="bg-[#f8fafc] dark:bg-gray-700/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/60">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">
                🇮🇱 יתרה שקלית (עו"ש)
              </span>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {isLoading ? '---' : fmt(cashBalanceILS, 'ILS')}
              </p>
              <span className="text-[11px] text-gray-400">
                מעמודת &quot;יתרה שקלית&quot;
              </span>
            </div>

            {/* USD Cash */}
            <div className="bg-[#f8fafc] dark:bg-gray-700/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/60">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">
                🇺🇸 יתרה דולרית (נייר 99028)
              </span>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {isLoading ? '---' : fmt(cashBalanceUSD, 'USD')}
              </p>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                ≈ {isLoading ? '---' : fmt(cashBalanceUSD * usdIlsRate, 'ILS')}
              </span>
            </div>

            {/* Total Cash in ILS */}
            <div className="bg-[#eff6ff] dark:bg-blue-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/40">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mb-1">
                💰 סה&quot;כ מזומן משוקלל
              </span>
              <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                {isLoading ? '---' : fmt(totalCashILS, 'ILS')}
              </p>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {totalValueILS > 0 ? `${((totalCashILS / totalValueILS) * 100).toFixed(1)}% משווי התיק` : 'משוקלל לתיק'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <span>שער USD/ILS:</span>
        <span className="font-bold text-gray-900 dark:text-white">
          {usdIlsRate.toFixed(4)} ₪
        </span>
      </div>

      {/* Holdings Table */}
      <Card 
        title="אחזקות נוכחיות ומזומן" 
        subtitle={holdings.length > 0 ? `${holdings.length} ניירות ערך פעילים + יתרות מזומן` : 'מעודכן לפי נתוני שוק'}
        action={
          holdings.length > 0 && (
            <a 
              href="/transactions" 
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              צפה בכל העסקאות
            </a>
          )
        }
      >
        <HoldingsTable 
          holdings={holdings} 
          isLoading={isLoading} 
          usdIlsRate={usdIlsRate} 
          cashBalances={{
            ils: cashBalanceILS,
            usd: cashBalanceUSD,
            totalILS: totalCashILS,
          }}
        />
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-700/60 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
          <a href="/import" className="block text-center">
            <span className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-2xl mb-3">
              📤
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white">ייבוא עסקאות</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              העלה קובץ אקסל ממיטב טרייד
            </p>
          </a>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-700/60 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
          <a href="/import?tab=manual" className="block text-center">
            <span className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-2xl mb-3">
              📝
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white">הוסף עסקה</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              הוספת עסקה ידנית לתיק
            </p>
          </a>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-700/60 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
          <a href="/charts" className="block text-center">
            <span className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-2xl mb-3">
              📈
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white">צפה בגרפים</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ביצועי תיק והשוואה למדדים
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
