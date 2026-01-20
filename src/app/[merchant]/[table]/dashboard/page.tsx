'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner, Button, OfflineBanner } from '@/components/ui';
import { TableList } from '@/components/tables';
import { LeaveConfirmationModal, SessionExpiryWarning } from '@/components/session';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { createClient } from '@/lib/supabase/client';
import type { Merchant } from '@/types/database';
import type { Session } from '@/types/database';
import { isValidTableNumber } from '@/lib/utils/validators';
import { useTranslation } from '@/lib/i18n/context';

export default function DashboardPage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { isOffline } = useOnlineStatus();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'messages' | 'gifts'>('tables');

  const { currentSession } = useSessionStore();
  const merchantSlug = params.merchant;
  const currentTableNumber = parseInt(params.table, 10);

  // Check if this is demo mode
  const isDemo = merchantSlug === 'demo';

  useEffect(() => {
    async function loadMerchant() {
      if (!merchantSlug || !isValidTableNumber(currentTableNumber)) {
        setError('無効なURLです');
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
        setIsLoading(false);

        // Generate mock active sessions
        const mockSessions: Session[] = Array.from({ length: 8 }, (_, i) => {
          const isMale = i % 2 === 0;
          return {
            id: `demo-session-${i + 1}`,
            merchant_id: 'demo',
            table_number: i + 1,
            nickname: isMale ? `ユーザー${i + 1}さん` : `ユーザー${i + 1}さん`,
            gender: isMale ? 'male' : 'female',
            age_range: '20s_mid',
            party_size: Math.floor(Math.random() * 5) + 1,
            is_active: true,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          };
        });
        setActiveSessions(mockSessions);
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
          setError('店舗が見つかりません');
          setIsLoading(false);
          return;
        }

        const maxTables = data.settings?.max_tables ?? 50;
        if (currentTableNumber > maxTables) {
          setError('無効なテーブル番号です');
          setIsLoading(false);
          return;
        }

        setMerchant(data as Merchant);
      } catch (err) {
        console.error('Error loading merchant:', err);
        setError('エラーが発生しました');
        setIsLoading(false);
      }
    }

    loadMerchant();
  }, [merchantSlug, currentTableNumber, isDemo]);

  useEffect(() => {
    async function loadActiveSessions() {
      if (!merchant) return;

      if (isDemo) {
        // Mock sessions already loaded in merchant useEffect
        return;
      }

      const supabase = createClient();

      try {
        const { data: sessions, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('merchant_id', merchant.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .neq('id', currentSession?.id || '') // Exclude current session
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading sessions:', error);
          setError('アクティブなテーブルの取得に失敗しました');
        } else {
          setActiveSessions(sessions || []);
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
      }
    }

    loadActiveSessions();

    // Refresh every 30 seconds
    const interval = setInterval(loadActiveSessions, 30000);
    return () => clearInterval(interval);
  }, [merchant, currentSession?.id, isDemo]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTableSelect = useCallback((session: any) => {
    // Get session id from either format
    const sessionId = session.id || session.sessionId;
    const selectedSession = activeSessions.find(s => s.id === sessionId);
    if (!selectedSession) return;

    // Store partner session info
    useSessionStore.setState({
      partnerSession: {
        id: selectedSession.id,
        table_number: selectedSession.table_number,
        nickname: selectedSession.nickname || '',
        gender: selectedSession.gender,
        age_range: selectedSession.age_range,
        party_size: selectedSession.party_size,
      }
    });

    // Navigate to chat page with selected session
    router.push(`/${merchantSlug}/${currentTableNumber}/chat`);
  }, [activeSessions, merchantSlug, currentTableNumber, router]);

  const handleProfileClick = useCallback(() => {
    router.push(`/${merchantSlug}/${currentTableNumber}/profile`);
  }, [merchantSlug, currentTableNumber, router]);

  const handleHomeClick = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleLeave = useCallback(async () => {
    if (!currentSession?.id) return;

    try {
      // Update session to inactive
      const supabase = createClient();
      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', currentSession.id);

      // Clear session from store
      useSessionStore.getState().clearSession();

      // Navigate to home
      router.push('/');
    } catch (err) {
      console.error('Error leaving session:', err);
    }
  }, [currentSession?.id, router]);

  // Handle session end (expired)
  const handleSessionEnd = useCallback(() => {
    useSessionStore.getState().clearSession();
    localStorage.removeItem('tableconnect_session_id');
    router.push('/');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Container maxWidth="sm" className="text-center">
          <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-soft-white mb-4">
              エラー
            </h1>
            <p className="text-muted mb-6">{error}</p>
            <Button variant="primary" onClick={handleHomeClick} className="px-8 py-3">
              ホームに戻る
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Offline Banner */}
      <OfflineBanner
        isOffline={isOffline}
          onRetry={() => window.location.reload()}
      />

      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />

      <Container maxWidth="lg" className="relative z-10 py-8 stagger-children">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-4xl text-soft-white mb-2">
                {merchant.name}
              </h1>
              <p className="text-neon-cyan text-lg">
                テーブル {currentTableNumber}
              </p>
            </div>
            <Button variant="ghost" onClick={handleProfileClick} className="text-sm">
              プロフィル編集
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted">
              アクティブなテーブル: <span className="text-soft-white font-bold">{activeSessions.length}</span>
            </p>
            <p className="text-muted text-sm">
              セッション終了まであと <span className="text-neon-pink font-bold">2時間</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-midnight/50 border border-steel/30">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'tables'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/40'
                : 'text-muted hover:text-soft-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('tables.activeTables')}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/40'
                : 'text-muted hover:text-soft-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 012 2H7l-4 4V5a2 2 0 012-2zm-2-5a2 2 0 11-4V5a2 2 0 00-2H9l4 4v6zM3 7a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1h-8a1 1 0 01-1z" />
            </svg>
            {t('dashboard.messages')}
          </button>
          <button
            onClick={() => setActiveTab('gifts')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'gifts'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/40'
                : 'text-muted hover:text-soft-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4M5 7v10M9 13l4 4M15 13l-4-4M12 8v13M9 17l3 3M15 17l-3 3" />
            </svg>
            {t('gift.receivedGifts')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tables' && (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="テーブルを検索..."
                className="w-full px-6 py-4 rounded-2xl bg-midnight/50 border border-steel/30 text-soft-white text-lg placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
              />
            </div>

            {/* Table List */}
            <TableList
              sessions={activeSessions}
              currentSessionId={currentSession?.id || ''}
              onSelectTable={handleTableSelect}
              searchQuery={searchQuery}
            />
          </>
        )}

        {activeTab === 'messages' && (
          <div className="text-center py-16">
            <Button
              variant="primary"
              onClick={() => router.push(`/${merchantSlug}/${currentTableNumber}/messages`)}
              className="px-8 py-3"
            >
              {t('chat.viewConversations')}
            </Button>
          </div>
        )}

        {activeTab === 'gifts' && (
          <div className="text-center py-16">
            <Button
              variant="primary"
              onClick={() => router.push(`/${merchantSlug}/${currentTableNumber}/gifts`)}
              className="px-8 py-3"
            >
              {t('gift.viewReceivedGifts')}
            </Button>
          </div>
        )}
      </Container>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-midnight/90 backdrop-blur-sm border-t border-steel/30 py-4 px-4">
        <Container maxWidth="lg">
          <div className="flex items-center justify-between text-sm">
            <Button
              variant="ghost"
              onClick={() => setShowLeaveModal(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4 4M9 12h.01M15 9l-9 18-9 18z" />
              </svg>
              {t('session.leaveStore')}
            </Button>
            <p className="text-muted">
              Table Connect v1.0
            </p>
          </div>
        </Container>
      </div>

      {/* Leave Confirmation Modal */}
      <LeaveConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
      />

      {/* Session Expiry Warning */}
      <SessionExpiryWarning
        session={currentSession}
        onSessionEnd={handleSessionEnd}
        warningThresholdMs={60 * 60 * 1000} // 1 hour warning
      />
    </div>
  );
}
