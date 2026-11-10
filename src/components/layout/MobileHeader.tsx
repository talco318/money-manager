'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Zap, Eye, EyeOff, Lock, Smartphone } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { triggerPwaInstall } from '@/components/pwa/PwaInstaller';

interface MobileHeaderProps {
  onOpenMenu: () => void;
}

export function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { isBiometricEnabled, hasPin, lockApp } = useSecurity();

  return (
    <header className="lg:hidden flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 mb-4 shadow-xs border border-gray-100 dark:border-gray-800">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <span className="font-black text-base text-gray-900 dark:text-white tracking-tight">
          Money Manager
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {/* PWA Install Button */}
        <button
          onClick={triggerPwaInstall}
          className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          title="התקן כאפליקציה לנייד"
          aria-label="התקן אפליקציה לנייד"
        >
          <Smartphone className="w-5 h-5" />
        </button>

        {/* Lock Screen */}
        {(isBiometricEnabled || hasPin) && (
          <button
            onClick={lockApp}
            className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            title="נעל אפליקציה עכשיו"
            aria-label="נעל אפליקציה"
          >
            <Lock className="w-5 h-5" />
          </button>
        )}

        {/* Privacy Toggle */}
        <button
          onClick={togglePrivacy}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isPrivate ? 'בטל מצב פרטיות' : 'הפעל מצב פרטיות (הסתרת סכומים)'}
          aria-label="מצב פרטיות"
        >
          {isPrivate ? <EyeOff className="w-5 h-5 text-amber-500" /> : <Eye className="w-5 h-5" />}
        </button>

        {/* Menu Toggle */}
        <button
          onClick={onOpenMenu}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="פתח תפריט"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
