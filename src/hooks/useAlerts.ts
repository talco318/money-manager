'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Alert {
  id: string;
  symbol: string;
  name: string | null;
  type: 'price_above' | 'price_below' | 'percent_change' | 'pnl_target';
  targetPrice: number | null;
  percentChange: number | null;
  isActive: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

export interface AlertInput {
  symbol: string;
  name?: string;
  type: Alert['type'];
  targetPrice?: number;
  percentChange?: number;
}

interface UseAlertsResult {
  alerts: Alert[];
  activeAlerts: Alert[];
  triggeredAlerts: Alert[];
  isLoading: boolean;
  error: string | null;
  createAlert: (input: AlertInput) => Promise<boolean>;
  toggleAlert: (id: string, isActive: boolean) => Promise<boolean>;
  deleteAlert: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useAlerts(): UseAlertsResult {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/alerts');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch alerts');
      }

      setAlerts(data.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת ההתראות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(async (input: AlertInput): Promise<boolean> => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create alert');
      }

      // Add to local state
      setAlerts(prev => [data.data, ...prev]);
      return true;
    } catch (err) {
      console.error('Error creating alert:', err);
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת התראה');
      return false;
    }
  }, []);

  const toggleAlert = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update alert');
      }

      // Update local state
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive } : a));
      return true;
    } catch (err) {
      console.error('Error toggling alert:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון התראה');
      return false;
    }
  }, []);

  const deleteAlert = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/alerts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete alert');
      }

      // Remove from local state
      setAlerts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting alert:', err);
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת התראה');
      return false;
    }
  }, []);

  const activeAlerts = alerts.filter(a => a.isActive && !a.triggeredAt);
  const triggeredAlerts = alerts.filter(a => a.triggeredAt);

  return {
    alerts,
    activeAlerts,
    triggeredAlerts,
    isLoading,
    error,
    createAlert,
    toggleAlert,
    deleteAlert,
    refresh: fetchAlerts,
  };
}
