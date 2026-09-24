'use client';

import { useState } from 'react';
import { useTransactions, type TransactionType as TxFilterType } from '@/hooks';
import { Card, Button, Input, Select, Modal } from '@/components/ui';
import type { Transaction } from '@/hooks/useTransactions';

const typeLabels: Record<string, string> = {
  buy: 'קניה',
  sell: 'מכירה',
  dividend: 'דיבידנד',
  tax: 'מס',
  deposit: 'הפקדה',
  withdrawal: 'משיכה',
  fee: 'עמלה',
  currency_exchange: 'המרה',
};

const typeColors: Record<string, string> = {
  buy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  sell: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  dividend: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  tax: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  deposit: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  withdrawal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  fee: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  currency_exchange: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
};

function formatCurrency(value: number | null, currency: string = 'USD'): string {
  if (value === null || value === undefined) return '-';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatNumber(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function TransactionsList() {
  const {
    filteredTransactions,
    isLoading,
    error,
    filters,
    setFilters,
    deleteTransaction,
    refresh,
    stats,
  } = useTransactions();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteTransaction(transactionToDelete.id);
    setIsDeleting(false);
    
    if (success) {
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      symbol: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.symbol || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">סה״כ עסקאות</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.buys}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">קניות</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.sells}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">מכירות</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.dividends}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">דיבידנדים</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.deposits}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">הפקדות</p>
        </div>
      </div>

      {/* Filters */}
      <Card title="סינון עסקאות">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="סוג עסקה"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as TxFilterType })}
            options={[
              { value: 'all', label: 'הכל' },
              { value: 'buy', label: 'קניה' },
              { value: 'sell', label: 'מכירה' },
              { value: 'dividend', label: 'דיבידנד' },
              { value: 'deposit', label: 'הפקדה' },
              { value: 'withdrawal', label: 'משיכה' },
              { value: 'fee', label: 'עמלה' },
              { value: 'tax', label: 'מס' },
            ]}
          />
          <Input
            label="חיפוש נייר"
            placeholder="סמל או שם..."
            value={filters.symbol}
            onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
          />
          <Input
            label="מתאריך"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
          <Input
            label="עד תאריך"
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              מציג {filteredTransactions.length} מתוך {stats.total} עסקאות
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              נקה סינון
            </Button>
          </div>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Transactions Table */}
      <Card 
        title="היסטוריית עסקאות"
        action={
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            {isLoading ? 'טוען...' : 'רענן'}
          </Button>
        }
      >
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">
              {hasActiveFilters ? 'לא נמצאו עסקאות התואמות את הסינון' : 'אין עסקאות להצגה'}
            </p>
            <p className="text-sm">
              {hasActiveFilters ? 'נסה לשנות את פרמטרי הסינון' : 'יש לייבא עסקאות מקובץ אקסל או להוסיף עסקה ידנית'}
            </p>
            {!hasActiveFilters && (
              <a 
                href="/import" 
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ייבוא עסקאות
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto" dir="rtl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">תאריך</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סוג</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">נייר</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">כמות</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">מחיר</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">עמלה</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סה״כ $</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">סה״כ ₪</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[tx.type] || typeColors.fee}`}>
                        {typeLabels[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {tx.symbol || '-'}
                        </p>
                        {tx.name && tx.name !== tx.symbol && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {tx.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300" dir="ltr">
                      {tx.quantity ? formatNumber(tx.quantity, tx.quantity % 1 === 0 ? 0 : 4) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300" dir="ltr">
                      {tx.price ? formatCurrency(tx.price, tx.currency) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400" dir="ltr">
                      {tx.commission ? formatCurrency(tx.commission, tx.currency) : '-'}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white" dir="ltr">
                      {formatCurrency(tx.totalAmountUSD, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300" dir="ltr">
                      {tx.totalAmountILS ? `₪${formatNumber(tx.totalAmountILS)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteClick(tx)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="מחק עסקה"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="מחיקת עסקה"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            האם אתה בטוח שברצונך למחוק את העסקה הזו?
          </p>
          {transactionToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white">
                {typeLabels[transactionToDelete.type] || transactionToDelete.type}
                {transactionToDelete.symbol && ` - ${transactionToDelete.symbol}`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(transactionToDelete.date)}
                {transactionToDelete.quantity && ` • ${formatNumber(transactionToDelete.quantity)} יחידות`}
                {transactionToDelete.totalAmountUSD && ` • ${formatCurrency(transactionToDelete.totalAmountUSD)}`}
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 dark:text-red-400">
            שים לב: פעולה זו תעדכן גם את האחזקות שלך ואינה ניתנת לביטול.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              ביטול
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'מוחק...' : 'מחק עסקה'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
