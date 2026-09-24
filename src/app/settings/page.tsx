'use client';

import { MainLayout } from '@/components/layout';
import { SettingsPage } from '@/components/settings';

export default function Settings() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">הגדרות</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">ניהול הגדרות המערכת</p>
        </div>

        <SettingsPage />
      </div>
    </MainLayout>
  );
}
