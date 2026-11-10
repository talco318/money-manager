'use client';

import React, { useEffect, useState } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { Fingerprint, Lock, Shield, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export function BiometricLockScreen() {
  const {
    isLocked,
    isBiometricEnabled,
    hasPin,
    authenticateWithBiometrics,
    authenticateWithPin,
  } = useSecurity();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [usePinMode, setUsePinMode] = useState(false);

  // Auto-prompt biometrics when screen appears if biometrics is active and not already in PIN mode
  useEffect(() => {
    if (isLocked && isBiometricEnabled && !usePinMode) {
      triggerBiometrics();
    }
  }, [isLocked, isBiometricEnabled, usePinMode]);

  const triggerBiometrics = async () => {
    setIsAuthenticating(true);
    setPinError(false);
    try {
      await authenticateWithBiometrics();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinDigit = async (digit: string) => {
    if (pinInput.length >= 6) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError(false);

    // Try auto-verifying if 4 or 6 digits
    if (newPin.length >= 4) {
      const ok = await authenticateWithPin(newPin);
      if (ok) {
        setPinInput('');
      } else if (newPin.length >= 6) {
        setPinError(true);
        setTimeout(() => setPinInput(''), 600);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;
    const ok = await authenticateWithPin(pinInput);
    if (!ok) {
      setPinError(true);
      setTimeout(() => setPinInput(''), 600);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Shield / Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Money Manager</h2>
          <p className="text-sm text-slate-400 mt-1">
            האפליקציה נעולה להגנה על הנתונים הפיננסיים שלך
          </p>
        </div>

        {/* Biometric Scan Section */}
        {isBiometricEnabled && !usePinMode && (
          <div className="w-full flex flex-col items-center space-y-5 pt-2">
            <button
              onClick={triggerBiometrics}
              disabled={isAuthenticating}
              className="group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-75" />
              <Fingerprint className="w-14 h-14 text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-400">
                {isAuthenticating ? 'ממתין לסריקת טביעת אצבע...' : 'לחץ לסריקת טביעת אצבע / Face ID'}
              </p>
              <p className="text-xs text-slate-500">הנח את האצבע על חיישן המכשיר</p>
            </div>

            {hasPin && (
              <button
                onClick={() => setUsePinMode(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors pt-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                שימוש בקוד PIN במקום
              </button>
            )}
          </div>
        )}

        {/* PIN Entry Section */}
        {(usePinMode || !isBiometricEnabled) && hasPin && (
          <div className="w-full flex flex-col items-center space-y-5 pt-1">
            <form onSubmit={handlePinSubmit} className="w-full flex flex-col items-center space-y-4">
              {/* PIN Dots */}
              <div
                className={`flex gap-3 my-2 ${
                  pinError ? 'animate-shake' : ''
                }`}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinInput.length > idx
                        ? 'bg-emerald-400 border-emerald-400 scale-110'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  קוד PIN שגוי, נסה שוב
                </p>
              )}

              {/* Number Keypad */}
              <div className="grid grid-cols-3 gap-3 w-64 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinDigit(digit)}
                    className="w-16 h-14 mx-auto rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600/30 border border-slate-700/50 text-xl font-bold text-white transition-all active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <div />
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="w-16 h-14 mx-auto rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600/30 border border-slate-700/50 text-xl font-bold text-white transition-all active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinDelete}
                  className="w-16 h-14 mx-auto rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:bg-rose-600/20 border border-slate-700/50 text-sm font-semibold text-slate-300 transition-all active:scale-95 flex items-center justify-center"
                >
                  מחק
                </button>
              </div>

              {isBiometricEnabled && (
                <button
                  type="button"
                  onClick={() => setUsePinMode(false)}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors pt-2"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  חזרה לסריקת טביעת אצבע
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

