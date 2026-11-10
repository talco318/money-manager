'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
  maskAmount: (amountStr: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivate: false,
  togglePrivacy: () => {},
  maskAmount: (val) => val,
});

const STORAGE_KEY = 'mm_privacy_mode';

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsPrivate(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const togglePrivacy = () => {
    setIsPrivate((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const maskAmount = (amountStr: string) => {
    if (!isPrivate) return amountStr;
    if (amountStr.includes('₪')) return '₪••••••';
    if (amountStr.includes('$')) return '$••••••';
    return '••••••';
  };

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy, maskAmount }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

