'use client';

import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f7] dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 sm:p-5 lg:p-7">
      {/* Mobile Top Navigation */}
      <MobileHeader onOpenMenu={() => setMobileMenuOpen(true)} />

      {/* Main Layout Container */}
      <div className="max-w-[1520px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {/* Figma Style Sidebar */}
        <AppSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
