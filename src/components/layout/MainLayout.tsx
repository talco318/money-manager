'use client';

import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5f8] dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-3 sm:p-5 lg:p-7 pb-24 lg:pb-7 transition-colors">
      {/* Mobile Top Header */}
      <MobileHeader onOpenMenu={() => setMobileMenuOpen(true)} />

      {/* Main Layout Container */}
      <div className="max-w-[1540px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {/* Modern Collapsible Sidebar */}
        <AppSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Sleek Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}
