'use client';

import Link from 'next/link';
import { usePortfolio } from '@/hooks';
import { StatCard, Card, Button } from '@/components/ui';
import { HoldingsTable } from './HoldingsTable';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { triggerPwaInstall } from '@/components/pwa/PwaInstaller';
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  PlusCircle,
  TrendingUp,
  Smartphone,
  RefreshCw,
  Coins,
  ShieldCheck,
  Zap,
} from 'lucide-react';

function formatCurrency(value: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat(currency === 'ILS' ? 'he-IL' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              דשבורד התיק
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              חי 24/7
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            סקירה מרוכזת של הנכסים, התשואות, יתרות המזומן ורווחי ההון
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto flex-wrap">
          {/* Privacy Toggle */}
          <button
            onClick={togglePrivacy}
            className="px-3.5 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all flex items-center gap-2 text-xs font-bold shadow-2xs cursor-pointer"
            title={isPrivate ? 'בטל מצב פרטיות' : 'הפעל מצב פרטיות (הסתרת סכומים)'}
          >
            {isPrivate ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
            <span>{isPrivate ? 'חשוף סכומים' : 'מצב פרטיות'}</span>
          </button>

          {/* Refresh Button */}
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'מרענן...' : 'רענן'}</span>
          </Button>
        </div>
      </div>

      {/* Quick Action Chips Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/import"
          className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-500/50 hover:shadow-xs transition-all flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-right">
            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
              ייבוא אקסל
            </span>
            <span className="text-[10px] text-gray-400 block truncate">
              ממיטב טרייד
            </span>
          </div>
        </Link>

        <Link
          href="/analytics"
          className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-purple-500/50 hover:shadow-xs transition-all flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0 text-right">
            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
              מודיעין ותובנות
            </span>
            <span className="text-[10px] text-purple-500 font-bold block truncate">
              Sharpe, תרחישי קיצון
            </span>
          </div>
        </Link>

        <Link
          href="/transactions"
          className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/50 hover:shadow-xs transition-all flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-right">
            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
              יומן עסקאות
            </span>
            <span className="text-[10px] text-gray-400 block truncate">
              קניות, מכירות, דיבידנד
            </span>
          </div>
        </Link>

        <button
          onClick={triggerPwaInstall}
          className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-teal-500/50 hover:shadow-xs transition-all flex items-center gap-2.5 group text-right cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
              התקן לנייד
            </span>
            <span className="text-[10px] text-emerald-500 font-bold block truncate">
              PWA מסך בית
            </span>
          </div>
        </button>
      </div>

      {/* Intelligence Banner */}
      <Link
        href="/analytics"
        className="block p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-[1.003] transition-all"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-tight">
                  מודיעין פיננסי ואנליטיקת עומק
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-gray-900 shadow-2xs">
                  חדש!
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 line-clamp-1">
                מדדי שארפ וסורטינו, סימולטור תרחישי קיצון, פירוק תשואת מט"ח (FX vs Asset), ולוח דיבידנדים חזוי
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-md flex items-center gap-1.5 shrink-0 shadow-xs">
            <span>פתח</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-red-800 dark:text-red-200 text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="שווי התיק הכולל"
          value={isLoading ? '---' : fmt(totalValueILS, 'ILS')}
          subtitle={isLoading ? '---' : fmt(totalValue, 'USD')}
          icon={<Coins className="w-4 h-4 text-amber-500" />}
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
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          title="שינוי יומי (Daily PnL)"
          value={isLoading ? '---' : `${isDayPositive ? '+' : ''}${fmt(dayChange * usdIlsRate, 'ILS')}`}
          subtitle={isLoading ? '---' : `${isDayPositive ? '+' : ''}${fmt(dayChange, 'USD')}`}
          trend={isLoading ? undefined : { value: dayChangePercent, isPositive: isDayPositive }}
          icon={<Zap className="w-4 h-4 text-blue-500" />}
        />
        <StatCard
          title="מספר אחזקות פעילות"
          value={isLoading ? '---' : holdings.length.toString()}
          subtitle={isLoading ? '---' : 'מניות וקרנות סל בתיק'}
          icon={<ShieldCheck className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Cash Balances Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                יתרות מזומן בחשבון (מיטב טרייד)
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              יתרות המזומן הנזילות לפעילות, משוקללות בשווי הכולל של התיק
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* ILS Cash */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold block mb-1">
                🇮🇱 יתרה שקלית (עו"ש)
              </span>
              <p className="text-lg font-black text-gray-900 dark:text-white">
                {isLoading ? '---' : fmt(cashBalanceILS, 'ILS')}
              </p>
              <span className="text-[10px] text-gray-400">
                נזיל מיידית בשקלים
              </span>
            </div>

            {/* USD Cash */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold block mb-1">
                🇺🇸 יתרה דולרית (נייר 99028)
              </span>
              <p className="text-lg font-black text-gray-900 dark:text-white">
                {isLoading ? '---' : fmt(cashBalanceUSD, 'USD')}
              </p>
              <span className="text-[10px] text-gray-400">
                ≈ {isLoading ? '---' : fmt(cashBalanceUSD * usdIlsRate, 'ILS')}
              </span>
            </div>

            {/* Total Cash in ILS */}
            <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/40">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block mb-1">
                💰 סה"כ מזומן משוקלל
              </span>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                {isLoading ? '---' : fmt(totalCashILS, 'ILS')}
              </p>
              <span className="text-[10px] text-blue-800/70 dark:text-blue-300/70 font-semibold">
                {totalValueILS > 0 ? `${((totalCashILS / totalValueILS) * 100).toFixed(1)}% משווי התיק` : 'משוקלל'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Badge */}
      <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs">
        <span>שער המרה יציג (USD/ILS):</span>
        <span className="font-black text-gray-900 dark:text-white">
          ₪{usdIlsRate.toFixed(4)}
        </span>
        {lastUpdated && (
          <span className="text-gray-400 text-[10px] mr-2">
            • עודכן: {lastUpdated.toLocaleTimeString('he-IL')}
          </span>
        )}
      </div>

      {/* Holdings Table */}
      <Card
        title="אחזקות נוכחיות ומזומן"
        subtitle={holdings.length > 0 ? `${holdings.length} ניירות ערך פעילים + יתרות מזומן` : 'מעודכן לפי נתוני שוק'}
        action={
          holdings.length > 0 && (
            <Link
              href="/transactions"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              צפה בכל העסקאות ←
            </Link>
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
    </div>
  );
}
