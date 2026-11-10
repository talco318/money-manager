'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  ArrowLeftRight,
  UploadCloud,
  Bell,
  Settings,
  LogOut,
  Zap,
  X,
  Smartphone,
  Download,
  Shield,
} from 'lucide-react';
import { triggerPwaInstall } from '@/components/pwa/PwaInstaller';

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navSections = [
    {
      title: 'תצוגות ודשבורד',
      items: [
        { href: '/', label: 'דשבורד ראשי', icon: LayoutDashboard },
        { href: '/charts', label: 'גרפים ומדדים', icon: TrendingUp },
        { href: '/analytics', label: 'מודיעין ותובנות', icon: BarChart3, badge: 'חדש' },
      ],
    },
    {
      title: 'ניהול כספים',
      items: [
        { href: '/transactions', label: 'יומן עסקאות', icon: ArrowLeftRight },
        { href: '/import', label: 'ייבוא קבצים (Excel)', icon: UploadCloud },
      ],
    },
    {
      title: 'מערכת ואבטחה',
      items: [
        { href: '/alerts', label: 'התראות שוק', icon: Bell },
        { href: '/settings', label: 'הגדרות ואבטחה', icon: Settings },
      ],
    },
  ];

  const userName = session?.user?.name || 'משקיע פרטי';
  const userInitials =
    userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'MM';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:static top-0 right-0 z-50 h-full lg:h-auto
          w-72 bg-white dark:bg-gray-900 rounded-none lg:rounded-3xl p-5 shadow-sm border-l lg:border border-gray-100 dark:border-gray-800
          flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Top User Profile + Close button on mobile */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {userName}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span>תיק מנוהל ומאובטח</span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              aria-label="סגור תפריט"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Categories */}
          <div className="space-y-5">
            {navSections.map((section) => (
              <div key={section.title}>
                <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  {section.title}
                </div>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}

            {/* Logout button */}
            <div className="pt-2">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-all text-right cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>התנתקות</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Install PWA Card + App Info */}
        <div className="space-y-4 pt-4 mt-6 border-t border-gray-100 dark:border-gray-800">
          {/* Install App Prompt Card */}
          <button
            onClick={() => {
              triggerPwaInstall();
              onClose?.();
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 text-right flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>התקנה לנייד</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black">
                    PWA
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  פתח כאפליקציה במסך הבית
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Brand Footer */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="font-black text-sm text-gray-900 dark:text-white tracking-tight">
                Money Manager
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">v2.1</span>
          </div>
        </div>
      </aside>
    </>
  );
}
