'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Zap } from 'lucide-react';

interface MobileHeaderProps {
  onOpenMenu: () => void;
}

export function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-5 py-3.5 mb-4 shadow-xs border border-gray-100 dark:border-gray-700/60">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#2563eb] text-white flex items-center justify-center">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <span className="font-bold text-base text-gray-900 dark:text-white">
          Money Manager
        </span>
      </Link>

      <button
        onClick={onOpenMenu}
        className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="פתח תפריט"
      >
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
}
