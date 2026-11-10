'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { Card, Button, Input } from '@/components/ui';
import { Fingerprint, Lock, ShieldCheck, KeyRound, Smartphone, Check, AlertCircle } from 'lucide-react';

export function SecuritySettingsCard() {
  const {
    isBiometricSupported,
    isBiometricEnabled,
    hasPin,
    lockOnBlur,
    enableBiometrics,
    disableBiometrics,
    setSecurityPin,
    removeSecurityPin,
    setLockOnBlur,
    lockApp,
    authenticateWithBiometrics,
  } = useSecurity();

  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessingBio, setIsProcessingBio] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleBiometrics = async () => {
    if (isBiometricEnabled) {
      disableBiometrics();
      showFeedback('success', 'נעילה ביומטרית בוטלה');
    } else {
      setIsProcessingBio(true);
      const success = await enableBiometrics();
      setIsProcessingBio(false);
      if (success) {
        showFeedback('success', 'טביעת אצבע / Face ID הוגדרה בהצלחה!');
      } else {
        showFeedback('error', 'רישום ביומטרי בוטל או נכשל במכשיר זה');
      }
    }
  };

  const handleTestBiometrics = async () => {
    const ok = await authenticateWithBiometrics();
    if (ok) {
      showFeedback('success', 'זיהוי ביומטרי עבר בהצלחה!');
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) {
      showFeedback('error', 'קוד PIN חייב להכיל לפחות 4 ספרות');
      return;
    }
    if (pinInput !== pinConfirm) {
      showFeedback('error', 'קודי ה-PIN אינם תואמים');
      return;
    }

    const ok = await setSecurityPin(pinInput);
    if (ok) {
      setPinInput('');
      setPinConfirm('');
      setIsSettingPin(false);
      showFeedback('success', 'קוד PIN נשמר בהצלחה כגיבוי!');
    }
  };

  return (
    <Card
      title="אבטחה ונעילה ביומטרית"
      subtitle="הגנה על תיק ההשקעות באמצעות טביעת אצבע, Face ID וקוד PIN"
    >
      <div className="space-y-5">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-sm flex items-center gap-2 animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}

        {/* 1. Biometrics Section */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isBiometricEnabled
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                טביעת אצבע / זיהוי פנים
                {isBiometricEnabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                    פעיל
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isBiometricSupported
                  ? 'המכשיר שלך תומך בזיהוי ביומטרי (Touch ID / Face ID / Android Sensor)'
                  : 'זיהוי ביומטרי זמין במכשירי סמארטפון או מחשבים עם חיישן'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isBiometricEnabled && (
              <button
                type="button"
                onClick={handleTestBiometrics}
                className="px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                בדוק חיישן
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleBiometrics}
              disabled={isProcessingBio}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isBiometricEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isBiometricEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 2. Security PIN Section */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  hasPin
                    ? 'bg-blue-500/20 text-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  קוד PIN לגיבוי
                  {hasPin && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
                      מוגדר
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  קוד סודי לפתיחה במקרה שטביעת האצבע אינה זמינה
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {hasPin ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsSettingPin(!isSettingPin)}
                    className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors font-medium"
                  >
                    שנה PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeSecurityPin();
                      showFeedback('success', 'קוד ה-PIN הוסר');
                    }}
                    className="p-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                    title="הסר קוד PIN"
                  >
                    מחק
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSettingPin(true)}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                >
                  הגדר PIN
                </button>
              )}
            </div>
          </div>

          {/* PIN Setup Form */}
          {isSettingPin && (
            <form onSubmit={handleSavePin} className="pt-3 border-t border-gray-200 dark:border-gray-700/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    הזן קוד PIN חדש (4-6 ספרות)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-center text-lg tracking-widest text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    אמת קוד PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-center text-lg tracking-widest text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingPin(false);
                    setPinInput('');
                    setPinConfirm('');
                  }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs"
                >
                  שמור קוד PIN
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3. Auto-Lock on Background */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
          <div>
            <p className="font-bold text-gray-900 dark:text-white">נעילה אוטומטית ביציאה</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              נעל את האפליקציה אוטומטית בכל פעם שאתה יוצא ממנה, ממזער או עובר אפליקציה בנייד
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLockOnBlur(!lockOnBlur)}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
              lockOnBlur ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                lockOnBlur ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* 4. Test Lock Now Button */}
        {(isBiometricEnabled || hasPin) && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="secondary"
              onClick={lockApp}
              className="flex items-center gap-2 text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              נעל את האפליקציה עכשיו לבדיקה
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

