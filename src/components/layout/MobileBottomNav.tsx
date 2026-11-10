'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  ArrowLeftRight,
  Settings,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/charts', label: 'גרפים', icon: TrendingUp },
  { href: '/analytics', label: 'מודיעין', icon: Sparkles, badge: 'חדש' },
  { href: '/transactions', label: 'עסקאות', icon: ArrowLeftRight },
  { href: '/settings', label: 'הגדרות', icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ניווט תחתון לנייד"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/70 dark:border-gray-800/80 px-2 py-1.5 shadow-lg shadow-black/5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {item.badge && !isActive && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>

              <span className="text-[11px] mt-1 tracking-tight">
                {item.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

