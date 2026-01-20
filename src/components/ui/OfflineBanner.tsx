'use client';

import { useTranslation } from '@/lib/i18n/context';

interface OfflineBannerProps {
  isOffline: boolean;
  onRetry?: () => void;
}

export function OfflineBanner({ isOffline, onRetry }: OfflineBannerProps) {
  const { t } = useTranslation();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/95 backdrop-blur-sm border-b border-red-500/50">
      <div className="flex items-center justify-center gap-4 px-6 py-3">
        {/* Warning Icon */}
        <svg
          className="w-5 h-5 text-white flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        {/* Text */}
        <span className="text-white font-medium">{t('offline.title')}</span>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="px-4 py-1.5 rounded-full bg-white text-red-600 text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          {t('offline.retry')}
        </button>
      </div>
    </div>
  );
}
