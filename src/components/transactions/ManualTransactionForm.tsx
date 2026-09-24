'use client';

import { useState, useEffect, useCallback } from 'react';
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

const DEFAULT_COMMISSION = '7'; // Default commission in USD

export function ManualTransactionForm({ onSuccess, onCancel }: ManualTransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [priceSource, setPriceSource] = useState<'manual' | 'auto'>('manual');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'buy',
    symbol: '',
    name: '',
    quantity: '',
    price: '',
    currency: 'USD',
    commission: DEFAULT_COMMISSION,
    broker: 'Meitav',
  });

  // Fetch current price when symbol changes
  const fetchCurrentPrice = useCallback(async (symbol: string) => {
    if (!symbol || symbol.length < 1) return;
    
    setIsFetchingPrice(true);
    try {
      const response = await fetch(`/api/market?type=quote&symbol=${symbol}`);
      const data = await response.json();
      
      if (data.success && data.data?.price) {
        setFormData(prev => ({
          ...prev,
          price: data.data.price.toFixed(2),
          name: data.data.name || prev.name,
        }));
        setPriceSource('auto');
      }
    } catch (err) {
      // Silently fail - user can enter price manually
      console.log('Could not fetch price for', symbol);
    } finally {
      setIsFetchingPrice(false);
    }
  }, []);

  // Debounced symbol lookup
  useEffect(() => {
    const showStockFields = formData.type === 'buy' || formData.type === 'sell' || formData.type === 'dividend';
    if (!showStockFields || !formData.symbol || formData.symbol.length < 1) return;
    
    const timeoutId = setTimeout(() => {
      fetchCurrentPrice(formData.symbol);
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [formData.symbol, formData.type, fetchCurrentPrice]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
    
    // If user manually changes price, mark as manual
    if (field === 'price') {
      setPriceSource('manual');
    }
    
    // Clear price when symbol changes
    if (field === 'symbol') {
      setPriceSource('manual');
    }
  };

  const handleRefreshPrice = async () => {
    if (formData.symbol) {
      await fetchCurrentPrice(formData.symbol);
    }
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
        // Reset form but keep defaults
        setFormData({
          date: new Date().toISOString().split('T')[0],
          type: 'buy',
          symbol: '',
          name: '',
          quantity: '',
          price: '',
          currency: 'USD',
          commission: DEFAULT_COMMISSION,
          broker: 'Meitav',
        });
        setPriceSource('manual');
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
          <div>
            <Input
              label="סימול (Symbol)"
              placeholder="למשל: AAPL"
              value={formData.symbol}
              onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
              required={formData.type === 'buy' || formData.type === 'sell'}
            />
            {isFetchingPrice && (
              <p className="text-xs text-blue-500 mt-1">🔄 מחפש מחיר נוכחי...</p>
            )}
          </div>
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
            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    label={
                      <span className="flex items-center gap-2">
                        מחיר ליחידה
                        {priceSource === 'auto' && (
                          <span className="text-xs text-green-500 font-normal">✓ מחיר שוק</span>
                        )}
                      </span>
                    }
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshPrice}
                  disabled={!formData.symbol || isFetchingPrice}
                  className="mb-0.5"
                  title="רענן מחיר נוכחי"
                >
                  🔄
                </Button>
              </div>
            </div>
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
        <div>
          <Input
            type="number"
            step="0.01"
            label="עמלה"
            placeholder="7.00"
            value={formData.commission}
            onChange={(e) => handleChange('commission', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">ברירת מחדל: $7 (ניתן לשינוי)</p>
        </div>
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
          <div className="text-xs text-gray-500 mt-1 text-left">
            {parseFloat(formData.quantity).toFixed(4)} × ${parseFloat(formData.price).toFixed(2)} + ${parseFloat(formData.commission) || 0} עמלה
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
