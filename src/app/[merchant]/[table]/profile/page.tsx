'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner, Button, LanguageSelector } from '@/components/ui';
import { ProfileForm, type ProfileData } from '@/components/session/ProfileForm';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useI18n, useTranslation } from '@/lib/i18n/context';
import type { Merchant } from '@/types/database';
import type { Locale } from '@/lib/i18n';
import { isValidTableNumber } from '@/lib/utils/validators';

export default function ProfilePage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { setLocale, isHydrated } = useI18n();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'language' | 'profile'>('language');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  const { setCurrentSession, setMerchantInfo } = useSessionStore();

  // Check if user has already selected language (cookie exists)
  useEffect(() => {
    if (isHydrated) {
      const cookieLocale = document.cookie
        .split('; ')
        .find((row) => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];

      if (cookieLocale) {
        setHasSelectedLanguage(true);
        setStep('profile');
      }
    }
  }, [isHydrated]);

  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);

  // Check if this is demo mode
  const isDemo = merchantSlug === 'demo';

  useEffect(() => {
    async function loadMerchant() {
      if (!merchantSlug || !isValidTableNumber(tableNumber)) {
        setError(t('errors.unknownError'));
        setIsLoading(false);
        return;
      }

      // Demo mode: skip Supabase call and use mock merchant
      if (isDemo) {
        const demoMerchant: Merchant = {
          id: 'demo',
          name: 'Demo Store',
          slug: 'demo',
          description: 'Demo store for testing',
          address: null,
          phone: null,
          business_hours: null,
          settings: { max_tables: 50 },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMerchant(demoMerchant);
        setMerchantInfo('demo', tableNumber);
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        const { data, error: fetchError } = await supabase
          .from('merchants')
          .select('*')
          .eq('slug', merchantSlug)
          .eq('is_active', true)
          .single();

        if (fetchError || !data) {
          setError(t('mockTables.errors.storeNotFound'));
          setIsLoading(false);
          return;
        }

        const maxTables = data.settings?.max_tables ?? 50;
        if (tableNumber > maxTables) {
          setError(t('registration.invalidTableNumber', { max: maxTables }));
          setIsLoading(false);
          return;
        }

        setMerchant(data as Merchant);
        setMerchantInfo(data.id, tableNumber);
      } catch (err) {
        console.error('Error loading merchant:', err);
        setError(t('mockTables.errors.errorOccurred'));
      } finally {
        setIsLoading(false);
      }
    }

    loadMerchant();
  }, [merchantSlug, tableNumber, setMerchantInfo, t, isDemo]);

  const handleJoin = useCallback(
    async (profileData: ProfileData) => {
      if (!merchant) return;
      setIsJoining(true);

      try {
        // Demo mode: create local session without API call
        if (isDemo) {
          const demoSessionId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

          const demoSession = {
            id: demoSessionId,
            merchant_id: 'demo',
            table_number: tableNumber,
            nickname: profileData.nickname || null,
            gender: profileData.gender,
            age_range: profileData.ageRange,
            party_size: profileData.partySize,
            is_active: true,
            created_at: new Date().toISOString(),
            expires_at: expiresAt,
          };

          setCurrentSession(demoSession);
          localStorage.setItem('tableconnect_session_id', demoSessionId);
          localStorage.setItem(`tableconnect_session_demo_${tableNumber}`, demoSessionId);

          router.push(`/${merchantSlug}/${tableNumber}/dashboard`);
          return;
        }

        // Create session via API
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId: merchant.id,
            tableNumber,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const { sessionId } = await response.json();

        // Update session with profile data
        const updateResponse = await fetch(`/api/sessions/${sessionId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to join session');
        }

        const { session } = await updateResponse.json();

        // Store session in Zustand and localStorage
        setCurrentSession(session);
        localStorage.setItem('tableconnect_session_id', sessionId);

        // Navigate to dashboard
        router.push(`/${merchantSlug}/${tableNumber}/dashboard`);
      } catch (err) {
        console.error('Error joining session:', err);
        setError(t('session.errorOccurred'));
      } finally {
        setIsJoining(false);
      }
    },
    [merchant, tableNumber, merchantSlug, router, setCurrentSession, t, isDemo]
  );

  const handleLanguageSelect = useCallback(
    async (locale: Locale) => {
      await setLocale(locale);
      setHasSelectedLanguage(true);
      setStep('profile');
    },
    [setLocale]
  );

  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        {/* Ambient Background */}
        <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        {/* Ambient Background */}
        <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
        <Container maxWidth="sm" className="relative z-10 text-center">
          <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl stagger-children">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <svg
                className="w-8 h-8 text-red-400"
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
            </div>
            <h1 className="font-display text-2xl text-soft-white mb-4">
              {t('mockTables.errors.error')}
            </h1>
            <p className="text-muted mb-6">{error}</p>
            <Button
              variant="primary"
              onClick={() => router.push('/')}
              className="px-8 py-3"
            >
              {t('mockTables.errors.goHome')}
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  // Language selection step
  if (step === 'language' && !hasSelectedLanguage) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center py-8 p-4">
        {/* Ambient Background */}
        <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
        <Container maxWidth="sm" className="relative z-10">
          <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl stagger-children">
            {/* Language Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 flex items-center justify-center border border-neon-cyan/30">
                <span className="material-symbols-outlined text-4xl text-neon-cyan">language</span>
              </div>
            </div>

            <LanguageSelector onSelect={handleLanguageSelect} />

            {/* Merchant & Table Info */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span className="text-gray-400 font-medium">{merchant.name}</span>
                <span className="text-steel">•</span>
                <span className="text-gray-500">Table {tableNumber}</span>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Profile step
  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center py-8 p-4">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
      <Container maxWidth="sm" className="relative z-10">
        <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl">
          <div className="text-center mb-8">
            {/* Profile Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-cyan/10 flex items-center justify-center border border-neon-purple/30">
              <svg
                className="w-10 h-10 text-neon-purple"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h1 className="font-display text-2xl text-soft-white mb-3">
              {t('registration.stepProfile')}
            </h1>

            {/* Merchant & Table Info */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
              <span className="text-neon-cyan font-medium">{merchant.name}</span>
              <span className="text-steel">•</span>
              <span className="text-muted">{t('session.table')} {tableNumber}</span>
            </div>
          </div>

          <ProfileForm onSubmit={handleJoin} isLoading={isJoining} />

          <p className="text-center text-muted text-sm mt-6 leading-relaxed">
            {t('registration.privacyNote')}
          </p>
        </div>
      </Container>
    </div>
  );
}
