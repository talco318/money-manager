'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Transaction {
  id: string;
  date: string;
  type: string;
  symbol: string | null;
  name: string | null;
  quantity: number | null;
  price: number | null;
  currency: string;
  commission: number | null;
  additionalFees: number | null;
  totalAmountUSD: number | null;
  totalAmountILS: number | null;
  cashBalance: number | null;
  taxEstimate: number | null;
  broker: string | null;
  rawType: string | null;
  createdAt: string;
}

export type TransactionType = 'all' | 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal' | 'fee' | 'tax';

export interface TransactionFilters {
  type: TransactionType;
  symbol: string;
  dateFrom: string;
  dateTo: string;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  deleteTransaction: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  stats: {
    total: number;
    buys: number;
    sells: number;
    dividends: number;
    deposits: number;
  };
}

const defaultFilters: TransactionFilters = {
  type: 'all',
  symbol: '',
  dateFrom: '',
  dateTo: '',
};

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת העסקאות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(tx => {
    // Type filter
    if (filters.type !== 'all' && tx.type !== filters.type) {
      return false;
    }

    // Symbol filter
    if (filters.symbol) {
      const searchTerm = filters.symbol.toLowerCase();
      const matchesSymbol = tx.symbol?.toLowerCase().includes(searchTerm);
      const matchesName = tx.name?.toLowerCase().includes(searchTerm);
      if (!matchesSymbol && !matchesName) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateFrom) {
      const txDate = new Date(tx.date);
      const fromDate = new Date(filters.dateFrom);
      if (txDate < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const txDate = new Date(tx.date);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (txDate > toDate) {
        return false;
      }
    }

    return true;
  });

  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete transaction');
      }

      // Remove from local state
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת העסקה');
      return false;
    }
  }, []);

  // Calculate stats
  const stats = {
    total: transactions.length,
    buys: transactions.filter(tx => tx.type === 'buy').length,
    sells: transactions.filter(tx => tx.type === 'sell').length,
    dividends: transactions.filter(tx => tx.type === 'dividend').length,
    deposits: transactions.filter(tx => tx.type === 'deposit').length,
  };

  return {
    transactions,
    filteredTransactions,
    isLoading,
    error,
    filters,
    setFilters,
    deleteTransaction,
    refresh: fetchTransactions,
    stats,
  };
}
