'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    const isAuth = localStorage.getItem('portfolio_auth');
    if (isAuth === 'true') {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('portfolio_auth', 'true');
        localStorage.setItem('portfolio_auth_time', Date.now().toString());
        router.push('/');
      } else {
        setError('קוד שגוי');
        setPin('');
      }
    } catch (err) {
      setError('שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numbers, max 6 digits
    if (/^\d{0,6}$/.test(value)) {
      setPin(value);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-5xl">💰</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
              Portfolio Manager
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              הזן קוד גישה
            </p>
          </div>

          {/* PIN Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••••"
                className="w-full text-center text-3xl tracking-[0.5em] py-4 px-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                autoFocus
              />
              
              {/* PIN Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      pin.length > i
                        ? 'bg-blue-500'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-center text-red-500 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pin.length < 4 || isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? 'מאמת...' : 'כניסה'}
            </button>
          </form>

          {/* Info */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            קוד ברירת מחדל: 1234
          </p>
        </div>
      </div>
    </div>
  );
}
