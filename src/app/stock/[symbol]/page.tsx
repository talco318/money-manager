'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';

interface Transaction {
  id: string;
  date: string;
  type: string;
  quantity: number | null;
  price: number | null;
  commission: number;
  totalAmountUSD: number | null;
  totalAmountILS: number | null;
  rawType: string | null;
}

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  totalCost: number;
}

interface MarketQuote {
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
}

interface StockData {
  holding: Holding | null;
  transactions: Transaction[];
  quote: MarketQuote | null;
}

const typeLabels: Record<string, string> = {
  buy: 'קניה',
  sell: 'מכירה',
  dividend: 'דיבידנד',
};

const typeColors: Record<string, string> = {
  buy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sell: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  dividend: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatCurrency(value: number | null, currency = 'USD'): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

function formatNumber(value: number | null, decimals = 2): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export default function StockPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  
  const [data, setData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usdIlsRate, setUsdIlsRate] = useState(3.7);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch transactions for this symbol
        const txRes = await fetch(`/api/transactions?symbol=${symbol}`);
        const txData = await txRes.json();

        // Fetch holdings
        const holdingsRes = await fetch('/api/holdings');
        const holdingsData = await holdingsRes.json();
        
        const holding = holdingsData.data?.holdings?.find(
          (h: Holding) => h.symbol === symbol.toUpperCase()
        ) || null;

        // Fetch market quote
        const quoteRes = await fetch(`/api/market?type=quote&symbol=${symbol}`);
        const quoteData = await quoteRes.json();

        // Fetch USD/ILS rate
        const rateRes = await fetch('/api/market?type=usdils');
        const rateData = await rateRes.json();
        if (rateData.success) {
          setUsdIlsRate(rateData.data.rate);
        }

        setData({
          holding,
          transactions: txData.success ? txData.data : [],
          quote: quoteData.success ? quoteData.data : null,
        });
      } catch (err) {
        setError('שגיאה בטעינת הנתונים');
      } finally {
        setIsLoading(false);
      }
    }

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
            נסה שוב
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { holding, transactions, quote } = data || { holding: null, transactions: [], quote: null };
  
  // Calculate stats
  const buyTxs = transactions.filter(t => t.type === 'buy');
  const sellTxs = transactions.filter(t => t.type === 'sell');
  const dividendTxs = transactions.filter(t => t.type === 'dividend');
  
  const totalBought = buyTxs.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalSold = sellTxs.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalDividends = dividendTxs.reduce((sum, t) => sum + (t.totalAmountUSD || 0), 0);
  const totalCommissions = transactions.reduce((sum, t) => sum + (t.commission || 0), 0);
  
  const currentPrice = quote?.price || holding?.avgPrice || 0;
  const currentValue = (holding?.quantity || 0) * currentPrice;
  const totalCost = holding?.totalCost || 0;
  const pnl = currentValue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {symbol.toUpperCase()}
              </h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                {holding?.quantity ? `${formatNumber(holding.quantity, 0)} יחידות` : 'אין אחזקה'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {holding?.name || 'טוען...'}
            </p>
          </div>
          <a href="/" className="text-blue-600 hover:underline">
            ← חזרה לדשבורד
          </a>
        </div>

        {/* Current Price & Value */}
        {quote && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="!p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">מחיר נוכחי</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(quote.price)}
              </p>
              <p className={`text-sm ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {quote.change >= 0 ? '+' : ''}{formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
              </p>
            </Card>
            
            <Card className="!p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">שווי אחזקה</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(currentValue)}
              </p>
              <p className="text-sm text-gray-500">
                {formatNumber(currentValue * usdIlsRate, 0)} ₪
              </p>
            </Card>
            
            <Card className="!p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">רווח/הפסד</p>
              <p className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
              </p>
              <p className={`text-sm ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(pnlPercent)}
              </p>
            </Card>
            
            <Card className="!p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">מחיר ממוצע</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(holding?.avgPrice || 0)}
              </p>
              <p className="text-sm text-gray-500">עלות כוללת: {formatCurrency(totalCost)}</p>
            </Card>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
            <p className="text-sm text-gray-500">סה"כ עסקאות</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{buyTxs.length}</p>
            <p className="text-sm text-gray-500">קניות ({formatNumber(totalBought, 0)})</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{sellTxs.length}</p>
            <p className="text-sm text-gray-500">מכירות ({formatNumber(totalSold, 0)})</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalDividends)}</p>
            <p className="text-sm text-gray-500">דיבידנדים ({dividendTxs.length})</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCommissions)}</p>
            <p className="text-sm text-gray-500">עמלות</p>
          </div>
        </div>

        {/* Transaction History */}
        <Card title="היסטוריית עסקאות" subtitle={`${transactions.length} עסקאות נמצאו`}>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>לא נמצאו עסקאות עבור {symbol}</p>
              <a href="/import" className="text-blue-600 hover:underline mt-2 inline-block">
                ייבא עסקאות
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">תאריך</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סוג</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">כמות</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">מחיר</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">עמלה</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סה"כ $</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סה"כ ₪</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((tx) => (
                    <tr 
                      key={tx.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[tx.type] || 'bg-gray-100 text-gray-800'}`}>
                          {typeLabels[tx.type] || tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {tx.quantity ? formatNumber(tx.quantity, tx.quantity % 1 === 0 ? 0 : 4) : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {tx.price ? formatCurrency(tx.price) : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {tx.commission ? formatCurrency(tx.commission) : '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {tx.type === 'sell' && tx.totalAmountUSD ? '+' : ''}
                        {formatCurrency(tx.totalAmountUSD)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {tx.totalAmountILS ? `₪${formatNumber(tx.totalAmountILS)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Market Info */}
        {quote && (
          <Card title="נתוני שוק" subtitle="מעודכן בזמן אמת">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">טווח יומי</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(quote.dayLow)} - {formatCurrency(quote.dayHigh)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">טווח 52 שבועות</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(quote.fiftyTwoWeekLow)} - {formatCurrency(quote.fiftyTwoWeekHigh)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">סגירה קודמת</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(quote.previousClose)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">שווי שוק</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : '-'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
