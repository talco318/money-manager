'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks';
import { Card, Button, Select, Input, Modal } from '@/components/ui';

export function SettingsPage() {
  const { settings, isLoading, error, updateSettings, deleteAllData, exportData } = useSettings();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSettingChange = async (key: string, value: string | number | boolean) => {
    setIsSaving(true);
    setSaveMessage(null);
    
    const success = await updateSettings({ [key]: value });
    
    setIsSaving(false);
    setSaveMessage({
      type: success ? 'success' : 'error',
      text: success ? 'ההגדרות נשמרו בהצלחה' : 'שגיאה בשמירת ההגדרות',
    });

    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExport = async () => {
    await exportData();
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== 'מחק הכל') {
      return;
    }

    setIsDeleting(true);
    const success = await deleteAllData();
    setIsDeleting(false);

    if (success) {
      setDeleteModalOpen(false);
      setDeleteConfirmText('');
      window.location.reload(); // Refresh to show empty state
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card title="הגדרות כלליות" subtitle="הגדרות בסיסיות של המערכת">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                ברוקר ברירת מחדל
              </label>
              <Select
                value={settings?.defaultBroker || 'Meitav'}
                onChange={(e) => handleSettingChange('defaultBroker', e.target.value)}
                options={[
                  { value: 'Meitav', label: 'מיטב טרייד' },
                  { value: 'IBI', label: 'IBI' },
                  { value: 'Poalim', label: 'בנק הפועלים' },
                  { value: 'Leumi', label: 'בנק לאומי' },
                  { value: 'Other', label: 'אחר' },
                ]}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                תצוגת מטבע
              </label>
              <Select
                value={settings?.currencyDisplay || 'USD'}
                onChange={(e) => handleSettingChange('currencyDisplay', e.target.value)}
                options={[
                  { value: 'USD', label: 'דולר (USD)' },
                  { value: 'ILS', label: 'שקל (ILS)' },
                  { value: 'both', label: 'שניהם' },
                ]}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                תדירות רענון נתונים (דקות)
              </label>
              <Input
                type="number"
                min={1}
                max={60}
                value={settings?.refreshInterval || 15}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value) || 15)}
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                כל כמה דקות לרענן נתוני שוק (1-60)
              </p>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card title="התראות" subtitle="הגדרות התראות המערכת">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">התראות מחיר</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  קבל התראה כשמחיר נייר מגיע ליעד
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('notificationsEnabled', !settings?.notificationsEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings?.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                disabled={isSaving}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings?.notificationsEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 טיפ: ניתן להגדיר התראות ספציפיות בדף ההתראות
              </p>
              <a href="/alerts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                עבור להתראות →
              </a>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card title="ניהול נתונים" subtitle="ייצוא, ייבוא ומחיקת נתונים">
          <div className="space-y-4">
            <Button 
              variant="secondary" 
              className="w-full justify-center"
              onClick={handleExport}
            >
              📥 ייצוא נתונים (JSON)
            </Button>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                הייצוא כולל את כל העסקאות, האחזקות, ההתראות וההגדרות שלך
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <Button 
                variant="danger" 
                className="w-full justify-center"
                onClick={() => setDeleteModalOpen(true)}
              >
                🗑️ מחק את כל הנתונים
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                פעולה זו אינה ניתנת לביטול!
              </p>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card title="אודות" subtitle="מידע על המערכת">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">גרסה</span>
              <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">נתוני שוק</span>
              <span className="font-medium text-gray-900 dark:text-white">Yahoo Finance</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">מסד נתונים</span>
              <span className="font-medium text-gray-900 dark:text-white">PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 dark:text-gray-400">פיתוח</span>
              <span className="font-medium text-gray-900 dark:text-white">Next.js + Prisma</span>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                מערכת ניהול תיק השקעות - גרסת פיתוח
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        title="⚠️ מחיקת כל הנתונים"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 font-medium">
              אזהרה: פעולה זו תמחק לצמיתות את כל הנתונים שלך!
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside space-y-1">
              <li>כל העסקאות</li>
              <li>כל האחזקות</li>
              <li>כל ההתראות</li>
              <li>כל הדיבידנדים</li>
            </ul>
          </div>

          <p className="text-gray-700 dark:text-gray-300">
            להמשך, הקלד <strong className="text-red-600">מחק הכל</strong> בשדה למטה:
          </p>

          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder='הקלד "מחק הכל" לאישור'
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="secondary" 
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText('');
              }}
            >
              ביטול
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAll}
              disabled={deleteConfirmText !== 'מחק הכל' || isDeleting}
            >
              {isDeleting ? 'מוחק...' : 'מחק הכל לצמיתות'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
