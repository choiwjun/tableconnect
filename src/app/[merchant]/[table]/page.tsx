'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Merchant } from '@/types/database';
import { isValidTableNumber } from '@/lib/utils/validators';

export default function TablePage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);

  // Check if this is demo mode
  const isDemo = merchantSlug === 'demo';

  useEffect(() => {
    async function loadMerchant() {
      if (!merchantSlug || !isValidTableNumber(tableNumber)) {
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

        // Check if table number is valid for this merchant
        const maxTables = data.settings?.max_tables ?? 50;
        if (tableNumber > maxTables) {
          setError('無効なテーブル番号です');
          setIsLoading(false);
          return;
        }

        setMerchant(data as Merchant);
      } catch (err) {
        console.error('Error loading merchant:', err);
        setError('エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadMerchant();
  }, [merchantSlug, tableNumber, isDemo]);

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

  // Redirect to profile page to enter nickname
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container maxWidth="sm" className="text-center">
        <div className="glass rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-pink/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-neon-pink"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>

          <h1 className="font-display text-2xl text-soft-white mb-2">
            {merchant.name}
          </h1>
          <p className="text-neon-cyan mb-6">
            テーブル {tableNumber}
          </p>

          <p className="text-muted mb-8">
            テーブルコネクトへようこそ！
            <br />
            ニックネームを入力して始めましょう。
          </p>

          <button
            onClick={() => router.push(`/${merchantSlug}/${tableNumber}/profile`)}
            className="btn-primary w-full py-3 text-lg"
          >
            始める
          </button>
        </div>
      </Container>
    </div>
  );
}
