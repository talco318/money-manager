'use client';

import { usePortfolio } from '@/hooks';
import { StatCard, Card, Button } from '@/components/ui';
import { HoldingsTable } from './HoldingsTable';

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

  const totalValue = summary?.totalValue || 0;
  const totalValueILS = summary?.totalValueILS || 0;
  const totalPnL = summary?.totalPnL || 0;
  const totalPnLPercent = summary?.totalPnLPercent || 0;
  const dayChange = summary?.dayChange || 0;
  const dayChangePercent = summary?.dayChangePercent || 0;
  const cashBalanceILS = summary?.cashBalanceILS || 0;
  const cashBalanceUSD = summary?.cashBalanceUSD || 0;
  const totalCashILS = summary?.totalCashILS || (cashBalanceILS + (cashBalanceUSD * usdIlsRate));

  const isProfitable = totalPnL >= 0;
  const isDayPositive = dayChange >= 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">דשבורד</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">סקירה כללית של תיק ההשקעות שלך</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              עודכן: {lastUpdated.toLocaleTimeString('he-IL')}
            </span>
          )}
          <Button 
            onClick={refresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? 'טוען...' : 'רענן נתונים'}
          </Button>
        </div>
      </div>

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
          value={isLoading ? '---' : formatCurrency(totalValueILS, 'ILS')}
          subtitle={isLoading ? '---' : formatCurrency(totalValue, 'USD')}
          icon={<span className="text-2xl">💰</span>}
        />
        <StatCard
          title="רווח/הפסד כולל"
          value={isLoading ? '---' : formatCurrency(totalPnL * usdIlsRate, 'ILS')}
          subtitle={isLoading ? '---' : formatCurrency(totalPnL, 'USD')}
          trend={isLoading ? undefined : { value: totalPnLPercent, isPositive: isProfitable }}
          icon={<span className="text-2xl">{isProfitable ? '📈' : '📉'}</span>}
        />
        <StatCard
          title="שינוי יומי"
          value={isLoading ? '---' : `${isDayPositive ? '+' : ''}${formatCurrency(dayChange * usdIlsRate, 'ILS')}`}
          subtitle={isLoading ? '---' : `${isDayPositive ? '+' : ''}${formatCurrency(dayChange, 'USD')}`}
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

      {/* Cash Balances Section - Styled like Meitav Trade */}
      <div className="bg-gradient-to-r from-blue-900/15 via-indigo-900/15 to-purple-900/15 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/60 dark:border-blue-800/40 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">יתרות מזומן בחשבון (מיטב טרייד)</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              יתרות המזומן הזמינות לפעילות, משוקללות בתוך שווי התיק הכולל
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* ILS Cash */}
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">
                🇮🇱 יתרה שקלית (עו"ש)
              </span>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {isLoading ? '---' : formatCurrency(cashBalanceILS, 'ILS')}
              </p>
              <span className="text-[11px] text-gray-400">
                מעמודת &quot;יתרה שקלית&quot;
              </span>
            </div>

            {/* USD Cash */}
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">
                🇺🇸 יתרה דולרית (נייר 99028)
              </span>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {isLoading ? '---' : formatCurrency(cashBalanceUSD, 'USD')}
              </p>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                ≈ {isLoading ? '---' : formatCurrency(cashBalanceUSD * usdIlsRate, 'ILS')}
              </span>
            </div>

            {/* Total Cash in ILS */}
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 border border-blue-300 dark:border-blue-700/60">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mb-1">
                💰 סה&quot;כ מזומן משוקלל
              </span>
              <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                {isLoading ? '---' : formatCurrency(totalCashILS, 'ILS')}
              </p>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {totalValueILS > 0 ? `${((totalCashILS / totalValueILS) * 100).toFixed(1)}% משווי התיק` : 'משוקלל לתיק'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>שער USD/ILS:</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer">
          <a href="/import" className="block text-center">
            <span className="text-4xl block mb-2">📤</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">ייבוא עסקאות</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              העלה קובץ אקסל ממיטב טרייד
            </p>
          </a>
        </Card>
        <Card className="hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer">
          <a href="/import?tab=manual" className="block text-center">
            <span className="text-4xl block mb-2">📝</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">הוסף עסקה</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              הוספת עסקה ידנית לתיק
            </p>
          </a>
        </Card>
        <Card className="hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer">
          <a href="/charts" className="block text-center">
            <span className="text-4xl block mb-2">📈</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">צפה בגרפים</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ביצועי תיק והשוואה למדדים
            </p>
          </a>
        </Card>
      </div>
    </div>
  );
}
