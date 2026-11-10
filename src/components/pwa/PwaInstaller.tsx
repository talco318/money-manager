'use client';

import { useEffect, useState } from 'react';
import {
  Download,
  Share2,
  X,
  Smartphone,
  CheckCircle,
  MoreVertical,
  PlusSquare,
  Sparkles,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showGuide, setShowGuide] = useState<'ios' | 'android' | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check standalone mode (already installed & running as app)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Register Service Worker in all client environments
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // If update found, keep it fresh
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New PWA version available');
                }
              };
            }
          };
        })
        .catch((err) => console.warn('SW registration info:', err));
    }

    // Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Capture beforeinstallprompt event (Chrome, Edge, Samsung Internet on Android & Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for custom trigger from sidebar or settings
    const handleCustomTrigger = () => {
      setIsDismissed(false);
      if (deferredPrompt) {
        deferredPrompt.prompt().then(() => {
          deferredPrompt.userChoice.then(({ outcome }) => {
            if (outcome === 'accepted') setInstalled(true);
            setDeferredPrompt(null);
          });
        });
      } else if (isIosDevice) {
        setShowGuide('ios');
      } else {
        setShowGuide('android');
      }
    };

    window.addEventListener('trigger-pwa-install', handleCustomTrigger);

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });

    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
    };
  }, [deferredPrompt]);

  if (isStandalone || installed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowGuide('ios');
    } else {
      // Android / Desktop fallback guide
      setShowGuide('android');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <>
      {/* Floating Bottom Install Banner (Mobile & Desktop) */}
      {!isDismissed && (
        <div className="fixed bottom-20 lg:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md border border-emerald-500/30 text-white shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    התקן כאפליקציה לנייד
                  </p>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  גישה ישירה ממסך הבית, מהירה ומאובטחת
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>התקן</span>
              </button>
              <button
                onClick={handleDismiss}
                aria-label="סגור"
                className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android Installation Modal Guide */}
      {showGuide === 'android' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700/80 rounded-3xl p-5 text-white shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base">התקנה באנדרואיד (Chrome)</h3>
              </div>
              <button
                onClick={() => setShowGuide(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-relaxed">
                  לחץ על כפתור <strong>3 הנקודות (⋮)</strong> בפינה העליונה של הדפדפן (Chrome / Samsung Internet).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-relaxed">
                  בחר בתפריט באפשרות <strong>&quot;התקן אפליקציה&quot;</strong> (Install app) או <strong>&quot;הוסף למסך הבית&quot;</strong> (Add to Home screen).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-relaxed">
                  אשר את ההתקנה. האייקון של <strong>Money Manager</strong> יופיע במסך הבית שלך כאפליקציה עצמאית ללא סרגל דפדפן!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}

      {/* iOS Installation Modal Guide */}
      {showGuide === 'ios' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700/80 rounded-3xl p-5 text-white shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base">התקנה באייפון (iOS Safari)</h3>
              </div>
              <button
                onClick={() => setShowGuide(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-relaxed">
                  לחץ על כפתור השיתוף בתחתית המסך של דפדפן Safari (<Share2 className="w-3.5 h-3.5 inline text-blue-400" />).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-relaxed">
                  גלול מעט מטה ובחר באפשרות <strong>&quot;הוסף למסך הבית&quot;</strong> (Add to Home Screen).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-relaxed">
                  לחץ על <strong>&quot;הוסף&quot;</strong> בפינה העליונה. מעכשיו האפליקציה זמינה ישירות ממסך הבית במסך מלא.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Utility helper to trigger the PWA install prompt from anywhere in the app (Sidebar, Settings, Header)
 */
export function triggerPwaInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
  }
}
