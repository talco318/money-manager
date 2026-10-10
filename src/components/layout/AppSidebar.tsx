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
} from 'lucide-react';

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
        { href: '/', label: 'דשבורד', icon: LayoutDashboard },
        { href: '/charts', label: 'גרפים ומדדים', icon: TrendingUp },
        { href: '/analytics', label: 'אנליטיקה ודיבידנדים', icon: BarChart3 },
      ],
    },
    {
      title: 'ניהול כספים',
      items: [
        { href: '/transactions', label: 'עסקאות', icon: ArrowLeftRight },
        { href: '/import', label: 'ייבוא קבצים', icon: UploadCloud },
      ],
    },
    {
      title: 'מערכת',
      items: [
        { href: '/alerts', label: 'התראות שוק', icon: Bell },
        { href: '/settings', label: 'הגדרות', icon: Settings },
      ],
    },
  ];

  const userName = session?.user?.name || 'משקיע פרטי';
  const userInitials = userName
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
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:static top-0 right-0 z-50 h-full lg:h-auto
          w-72 bg-white dark:bg-gray-800 rounded-none lg:rounded-3xl p-6 shadow-sm border-l lg:border border-gray-100 dark:border-gray-700/60
          flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Top User Profile + Close button on mobile */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-gray-900 to-gray-700 text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-gray-900 dark:text-white truncate">
                  {userName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ניהול תיק אישי
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="סגור תפריט"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Categories */}
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-3">
                  {section.title}
                </div>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#eef4ff] dark:bg-blue-900/30 text-[#2563eb] dark:text-blue-400 font-semibold shadow-xs'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? 'text-[#2563eb] dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}

            {/* System Actions (Logout) */}
            <div>
              <nav className="pt-2">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-all text-right"
                >
                  <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>התנתקות</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="pt-6 mt-8 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#2563eb] text-white flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-base text-gray-900 dark:text-white tracking-tight">
              Money Manager
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
