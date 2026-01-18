'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner } from '@/components/ui';
import { NicknameForm } from '@/components/session';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/lib/stores/sessionStore';
import type { Merchant } from '@/types/database';
import { isValidTableNumber } from '@/lib/utils/validators';

export default function ProfilePage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setCurrentSession, setMerchantInfo } = useSessionStore();

  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);

  useEffect(() => {
    async function loadMerchant() {
      if (!merchantSlug || !isValidTableNumber(tableNumber)) {
        setError('無効なURLです');
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
          setError('店舗が見つかりません');
          setIsLoading(false);
          return;
        }

        const maxTables = data.settings?.max_tables ?? 50;
        if (tableNumber > maxTables) {
          setError('無効なテーブル番号です');
          setIsLoading(false);
          return;
        }

        setMerchant(data as Merchant);
        setMerchantInfo(data.id, tableNumber);
      } catch (err) {
        console.error('Error loading merchant:', err);
        setError('エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadMerchant();
  }, [merchantSlug, tableNumber, setMerchantInfo]);

  const handleJoin = useCallback(
    async (nickname: string) => {
      if (!merchant) return;

      setIsJoining(true);

      try {
        // Create or get session via API
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

        // Update session with nickname
        const joinResponse = await fetch(`/api/sessions/${sessionId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname }),
        });

        if (!joinResponse.ok) {
          throw new Error('Failed to join session');
        }

        const { session } = await joinResponse.json();

        // Store session in Zustand and localStorage
        setCurrentSession(session);
        localStorage.setItem('tableconnect_session_id', sessionId);

        // Navigate to main chat/table view
        router.push(`/${merchantSlug}/${tableNumber}/chat`);
      } catch (err) {
        console.error('Error joining session:', err);
        setError('セッションへの参加に失敗しました');
      } finally {
        setIsJoining(false);
      }
    },
    [merchant, tableNumber, merchantSlug, router, setCurrentSession]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container maxWidth="sm" className="text-center">
          <div className="glass rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
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
              エラー
            </h1>
            <p className="text-muted mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary px-6 py-2"
            >
              ホームに戻る
            </button>
          </div>
        </Container>
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <Container maxWidth="sm">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-purple/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-neon-purple"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h1 className="font-display text-2xl text-soft-white mb-2">
              プロフィール設定
            </h1>
            <p className="text-muted">
              <span className="text-neon-cyan">{merchant.name}</span> の
              <br />
              テーブル {tableNumber} に参加します
            </p>
          </div>

          <NicknameForm onSubmit={handleJoin} isLoading={isJoining} />

          <p className="text-center text-muted text-sm mt-6">
            ニックネームは店内の他のテーブルに表示されます。
            <br />
            不適切な名前は使用できません。
          </p>
        </div>
      </Container>
    </div>
  );
}
