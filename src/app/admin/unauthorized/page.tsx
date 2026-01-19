'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button, Container } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/context';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />

      <Container maxWidth="sm" className="relative z-10">
        <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl text-center">
          {/* Animated Warning Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center border border-red-500/30 relative">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
            <svg
              className="w-10 h-10 text-red-400 relative z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          <h1 className="font-display text-3xl text-soft-white mb-4">
            {t('auth.unauthorized')}
          </h1>

          <p className="text-muted mb-8 leading-relaxed">
            {t('auth.unauthorizedDescription')}
          </p>

          {/* Access Denied Badge */}
          <div className="flex items-center justify-center gap-2 mb-8 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mx-auto w-fit">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm text-red-400">Access Denied</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="flex-1 py-3"
              onClick={() => router.back()}
            >
              {t('common.back')}
            </Button>
            <Button
              variant="primary"
              className="flex-1 py-3"
              onClick={handleLogout}
            >
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
