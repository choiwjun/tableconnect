'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner } from '@/components/ui';
import { ChatRoom } from '@/components/chat';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/lib/stores/sessionStore';
import type { Session } from '@/types/database';
import { useTranslation } from '@/lib/i18n/context';

export default function ChatPage() {
  const params = useParams<{ merchant: string; table: string; sessionId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [partnerSession, setPartnerSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentSession, setPartnerSession: setStorePartnerSession } = useSessionStore();
  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);
  const partnerSessionId = params.sessionId;

  // Check if this is demo mode
  const isDemo = merchantSlug === 'demo';

  useEffect(() => {
    async function loadPartnerSession() {
      if (!partnerSessionId) {
        setError('無効なセッションIDです');
        setIsLoading(false);
        return;
      }

      // Validate partner session ID is not current session
      if (partnerSessionId === currentSession?.id) {
        setError('自分とチャットすることはできません');
        setIsLoading(false);
        return;
      }

      // Demo mode: create mock partner session
      if (isDemo) {
        const demoPartner: Session = {
          id: partnerSessionId,
          merchant_id: 'demo',
          table_number: Math.floor(Math.random() * 20) + 1,
          nickname: 'デモユーザー',
          gender: Math.random() > 0.5 ? 'male' : 'female',
          age_range: '20s_mid',
          party_size: Math.floor(Math.random() * 5) + 1,
          is_active: true,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        };
        setPartnerSession(demoPartner);
        setStorePartnerSession(demoPartner);
        setIsLoading(false);
        return;
      }

      // Real mode: fetch partner session from Supabase
      const supabase = createClient();

      try {
        const { data, error: fetchError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', partnerSessionId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (fetchError || !data) {
          setError('相手のセッションが見つかりません');
          setIsLoading(false);
          return;
        }

        setPartnerSession(data as Session);
        setStorePartnerSession(data as Session);
      } catch (err) {
        console.error('Error loading partner session:', err);
        setError('セッション情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadPartnerSession();
  }, [partnerSessionId, currentSession?.id, isDemo, setStorePartnerSession]);

  const handleBack = useCallback(() => {
    router.push(`/${merchantSlug}/${tableNumber}/dashboard`);
  }, [merchantSlug, tableNumber, router]);

  const handleLeave = useCallback(() => {
    router.push('/');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !partnerSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Container maxWidth="sm" className="text-center">
          <div className="glass-panel rounded-2xl p-8">
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
              {error || 'エラー'}
            </h1>
            <div className="flex gap-4 mt-6">
              <Button variant="primary" onClick={handleBack} className="flex-1">
                ダッシュボードに戻る
              </Button>
              <Button variant="ghost" onClick={handleLeave} className="flex-1">
                ホームに戻る
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />

      {/* Chat Room */}
      <ChatRoom
        sessionId={currentSession?.id || ''}
        partnerId={partnerSession.id}
        partnerNickname={partnerSession.nickname || `テーブル ${partnerSession.table_number}`}
        partnerTableNumber={partnerSession.table_number}
      />
    </div>
  );
}
