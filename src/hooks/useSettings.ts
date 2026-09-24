'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Settings {
  id: string;
  defaultBroker: string;
  currencyDisplay: string;
  refreshInterval: number;
  notificationsEnabled: boolean;
}

interface UseSettingsResult {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>;
  deleteAllData: () => Promise<boolean>;
  exportData: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/settings');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      setSettings(data.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת ההגדרות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<Settings>): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSettings(data.data);
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון ההגדרות');
      return false;
    }
  }, []);

  const deleteAllData = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings?confirm=DELETE_ALL_DATA', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete data');
      }

      return true;
    } catch (err) {
      console.error('Error deleting data:', err);
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת הנתונים');
      return false;
    }
  }, []);

  const exportData = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/export');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בייצוא הנתונים');
    }
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    deleteAllData,
    exportData,
    refresh: fetchSettings,
  };
}
