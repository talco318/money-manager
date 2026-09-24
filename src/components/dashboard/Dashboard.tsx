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
  const cashBalance = summary?.cashBalance || 0;

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

      {/* Exchange Rate Info */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>שער USD/ILS:</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {usdIlsRate.toFixed(4)} ₪
        </span>
      </div>

      {/* Holdings Table */}
      <Card 
        title="אחזקות נוכחיות" 
        subtitle={holdings.length > 0 ? `${holdings.length} נכסים בתיק` : 'מעודכן לפי נתוני שוק'}
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
        <HoldingsTable holdings={holdings} isLoading={isLoading} usdIlsRate={usdIlsRate} />
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

      {/* Cash Balance Section */}
      {cashBalance > 0 && (
        <Card title="יתרת מזומן" subtitle="לפי הדוח האחרון מהברוקר">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(cashBalance, 'ILS')} ₪
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ≈ {formatCurrency(cashBalance / usdIlsRate)}
              </p>
            </div>
            <span className="text-4xl">💵</span>
          </div>
        </Card>
      )}
    </div>
  );
}
