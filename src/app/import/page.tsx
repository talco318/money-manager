'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui';
import { FileUpload, ManualTransactionForm } from '@/components/transactions';

type TabType = 'upload' | 'manual';

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [importCount, setImportCount] = useState(0);

  const handleImportComplete = (summary: { imported: number }) => {
    setImportCount(prev => prev + summary.imported);
  };

  const handleManualSuccess = () => {
    setImportCount(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ייבוא עסקאות</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              העלה קובץ אקסל ממיטב טרייד או הוסף עסקאות ידנית
            </p>
          </div>
          {importCount > 0 && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
              ✅ {importCount} עסקאות יובאו בסשן זה
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            📂 העלאת קובץ
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            ✏️ הוספה ידנית
          </button>
        </div>

        {/* Content */}
        {activeTab === 'upload' ? (
          <Card title="העלאת קובץ אקסל" subtitle="גרור קובץ או לחץ לבחירה">
            <FileUpload onImportComplete={handleImportComplete} />
            
            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                📋 איך להוריד את הקובץ ממיטב טרייד?
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>היכנס לחשבון במיטב טרייד</li>
                <li>עבור ל"תנועות בחשבון" או "היסטוריית פעולות"</li>
                <li>בחר את טווח התאריכים הרצוי</li>
                <li>לחץ על "ייצוא לאקסל" והורד את הקובץ</li>
                <li>העלה את הקובץ כאן</li>
              </ol>
            </div>
          </Card>
        ) : (
          <Card title="הוספת עסקה ידנית" subtitle="מלא את פרטי העסקה">
            <ManualTransactionForm onSuccess={handleManualSuccess} />
          </Card>
        )}

        {/* Quick Links */}
        <div className="flex gap-4">
          <a
            href="/transactions"
            className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
          >
            <span className="text-2xl block mb-1">📝</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">צפה בעסקאות</span>
          </a>
          <a
            href="/"
            className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
          >
            <span className="text-2xl block mb-1">📊</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">חזור לדשבורד</span>
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
