'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';

interface ManualTransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TRANSACTION_TYPES = [
  { value: 'buy', label: 'קנייה' },
  { value: 'sell', label: 'מכירה' },
  { value: 'dividend', label: 'דיבידנד' },
  { value: 'deposit', label: 'הפקדה' },
  { value: 'withdrawal', label: 'משיכה' },
  { value: 'fee', label: 'עמלה' },
];

const CURRENCIES = [
  { value: 'USD', label: 'דולר (USD)' },
  { value: 'ILS', label: 'שקל (ILS)' },
];

const BROKERS = [
  { value: 'Meitav', label: 'מיטב טרייד' },
  { value: 'IBI', label: 'IBI' },
  { value: 'Poalim', label: 'בנק הפועלים' },
  { value: 'Leumi', label: 'בנק לאומי' },
  { value: 'Other', label: 'אחר' },
];

export function ManualTransactionForm({ onSuccess, onCancel }: ManualTransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'buy',
    symbol: '',
    name: '',
    quantity: '',
    price: '',
    currency: 'USD',
    commission: '',
    broker: 'Meitav',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (!formData.date) {
      setError('יש לבחור תאריך');
      setIsSubmitting(false);
      return;
    }

    if ((formData.type === 'buy' || formData.type === 'sell') && !formData.symbol) {
      setError('יש להזין סימול מניה לעסקאות קנייה/מכירה');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          commission: formData.commission ? parseFloat(formData.commission) : 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          type: 'buy',
          symbol: '',
          name: '',
          quantity: '',
          price: '',
          currency: 'USD',
          commission: '',
          broker: 'Meitav',
        });
        onSuccess?.();
      } else {
        setError(result.error || 'שגיאה בשמירת העסקה');
      }
    } catch (err) {
      setError('שגיאה בשמירת העסקה. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showStockFields = formData.type === 'buy' || formData.type === 'sell' || formData.type === 'dividend';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          ✅ העסקה נשמרה בהצלחה!
        </div>
      )}

      {/* Row 1: Date, Type, Broker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="date"
          label="תאריך"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
        />
        <Select
          label="סוג עסקה"
          options={TRANSACTION_TYPES}
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          required
        />
        <Select
          label="ברוקר"
          options={BROKERS}
          value={formData.broker}
          onChange={(e) => handleChange('broker', e.target.value)}
        />
      </div>

      {/* Row 2: Symbol, Name (only for stock transactions) */}
      {showStockFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="סימול (Symbol)"
            placeholder="למשל: AAPL"
            value={formData.symbol}
            onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
            required={formData.type === 'buy' || formData.type === 'sell'}
          />
          <Input
            label="שם הנייר"
            placeholder="למשל: Apple Inc"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
      )}

      {/* Row 3: Quantity, Price, Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {showStockFields && (
          <>
            <Input
              type="number"
              step="0.0001"
              label="כמות"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              label="מחיר ליחידה"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
            />
          </>
        )}
        <Select
          label="מטבע"
          options={CURRENCIES}
          value={formData.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
        />
      </div>

      {/* Row 4: Commission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="number"
          step="0.01"
          label="עמלה"
          placeholder="0.00"
          value={formData.commission}
          onChange={(e) => handleChange('commission', e.target.value)}
        />
      </div>

      {/* Calculated Total */}
      {showStockFields && formData.quantity && formData.price && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">סה"כ עסקה:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formData.currency === 'USD' ? '$' : '₪'}
              {(parseFloat(formData.quantity) * parseFloat(formData.price) + 
                (parseFloat(formData.commission) || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            ביטול
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          שמור עסקה
        </Button>
      </div>
    </form>
  );
}
