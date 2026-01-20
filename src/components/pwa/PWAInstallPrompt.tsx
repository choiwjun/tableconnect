'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

// Define BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAInstallPromptProps {
  onInstall?: () => void;
  onClose?: () => void;
}

export function PWAInstallPrompt({ onInstall, onClose }: PWAInstallPromptProps = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!deferredPrompt) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      onInstall?.();
    }
  };

  const handleDismiss = () => {
    setDeferredPrompt(null);
    onClose?.();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="glass-panel rounded-2xl p-4 border border-neon-cyan/30 shadow-lg shadow-neon-cyan/20 max-w-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-neon-cyan"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-soft-white mb-1">
              {isIOS ? 'ホーム画面に追加します' : 'アプリをインストール'}
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              {isIOS
                ? 'Safariの共有ボタンから追加を選択して、ホーム画面に追加してください。'
                : 'オフラインでもご利用いただけます！'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleInstallClick}
            className="flex-1"
          >
            {isIOS ? '追加方法を確認' : 'インストール'}
          </Button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm text-muted hover:text-soft-white transition-colors"
          >
            後で
          </button>
        </div>
      </div>
    </div>
  );
}
