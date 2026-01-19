'use client';

import { Container, Button } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/context';

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />

      <Container maxWidth="sm" className="text-center relative z-10">
        <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl">
          {/* Animated Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-steel/20 to-steel/10 flex items-center justify-center border border-steel/30 relative">
            <div className="absolute inset-0 rounded-full bg-steel/10 animate-ping" />
            <svg
              className="w-10 h-10 text-steel relative z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>

          <h1 className="font-display text-3xl text-soft-white mb-4">
            {t('offline.title')}
          </h1>

          <p className="text-muted mb-8 leading-relaxed">
            {t('offline.description')}
          </p>

          {/* Connection Status Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mx-auto w-fit">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm text-red-400">{t('offline.status')}</span>
          </div>

          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="px-8 py-3"
          >
            {t('offline.retry')}
          </Button>
        </div>
      </Container>
    </div>
  );
}
