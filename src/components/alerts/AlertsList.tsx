'use client';

import { useState } from 'react';
import { useAlerts, type Alert, type AlertInput } from '@/hooks';
import { Card, Button, Input, Select, Modal } from '@/components/ui';

const typeLabels: Record<string, string> = {
  price_above: 'מחיר מעל',
  price_below: 'מחיר מתחת',
  percent_change: 'שינוי באחוזים',
  pnl_target: 'יעד רווח/הפסד',
};

const typeColors: Record<string, string> = {
  price_above: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  price_below: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  percent_change: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  pnl_target: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AlertsList() {
  const {
    alerts,
    activeAlerts,
    isLoading,
    error,
    createAlert,
    toggleAlert,
    deleteAlert,
    refresh,
  } = useAlerts();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<AlertInput>({
    symbol: '',
    name: '',
    type: 'price_above',
    targetPrice: undefined,
    percentChange: undefined,
  });

  const handleCreateAlert = async () => {
    setIsSubmitting(true);
    const success = await createAlert(formData);
    setIsSubmitting(false);
    
    if (success) {
      setIsCreateModalOpen(false);
      setFormData({
        symbol: '',
        name: '',
        type: 'price_above',
        targetPrice: undefined,
        percentChange: undefined,
      });
    }
  };

  const handleDeleteClick = (alert: Alert) => {
    setAlertToDelete(alert);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!alertToDelete) return;
    
    setIsSubmitting(true);
    const success = await deleteAlert(alertToDelete.id);
    setIsSubmitting(false);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setAlertToDelete(null);
    }
  };

  const handleToggle = async (alert: Alert) => {
    await toggleAlert(alert.id, !alert.isActive);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{alerts.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">סה״כ התראות</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{activeAlerts.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">התראות פעילות</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.triggeredAt).length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">הופעלו</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Alerts Card */}
      <Card
        title="רשימת התראות"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
              רענן
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              הוסף התראה
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <span className="text-5xl block mb-4">🔔</span>
            <p className="text-lg mb-2">אין התראות</p>
            <p className="text-sm mb-4">צור התראה חדשה כדי לקבל עדכונים על שינויי מחירים</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              צור התראה ראשונה
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  alert.isActive
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(alert)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      alert.isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        alert.isActive ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {alert.symbol}
                      </span>
                      {alert.name && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {alert.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[alert.type]}`}>
                        {typeLabels[alert.type]}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {alert.type === 'percent_change'
                          ? `${alert.percentChange}%`
                          : `$${alert.targetPrice?.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status */}
                  {alert.triggeredAt && (
                    <div className="text-right">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        הופעל
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(alert.triggeredAt)}
                      </p>
                    </div>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteClick(alert)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Alert Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="יצירת התראה חדשה"
      >
        <div className="space-y-4">
          <Input
            label="סמל נייר"
            placeholder="AAPL, MSFT..."
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            required
          />
          <Input
            label="שם (אופציונלי)"
            placeholder="Apple Inc."
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            label="סוג התראה"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertInput['type'] })}
            options={[
              { value: 'price_above', label: 'כשהמחיר יעלה מעל' },
              { value: 'price_below', label: 'כשהמחיר ירד מתחת' },
              { value: 'percent_change', label: 'שינוי באחוזים (יומי)' },
            ]}
          />
          {(formData.type === 'price_above' || formData.type === 'price_below') && (
            <Input
              label="מחיר יעד ($)"
              type="number"
              step="0.01"
              placeholder="150.00"
              value={formData.targetPrice || ''}
              onChange={(e) => setFormData({ ...formData, targetPrice: parseFloat(e.target.value) || undefined })}
              required
            />
          )}
          {formData.type === 'percent_change' && (
            <Input
              label="אחוז שינוי"
              type="number"
              step="0.1"
              placeholder="5"
              value={formData.percentChange || ''}
              onChange={(e) => setFormData({ ...formData, percentChange: parseFloat(e.target.value) || undefined })}
              required
            />
          )}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleCreateAlert} 
              disabled={isSubmitting || !formData.symbol}
            >
              {isSubmitting ? 'יוצר...' : 'צור התראה'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="מחיקת התראה"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            האם אתה בטוח שברצונך למחוק את ההתראה הזו?
          </p>
          {alertToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white">
                {alertToDelete.symbol}
                {alertToDelete.name && ` - ${alertToDelete.name}`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {typeLabels[alertToDelete.type]}: {
                  alertToDelete.type === 'percent_change'
                    ? `${alertToDelete.percentChange}%`
                    : `$${alertToDelete.targetPrice?.toFixed(2)}`
                }
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              ביטול
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'מוחק...' : 'מחק התראה'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
