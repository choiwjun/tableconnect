'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Button, Spinner, Header } from '@/components/ui';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import type { Gift, Menu } from '@/types/database';

export default function GiftsPage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receivedGifts, setReceivedGifts] = useState<Array<{
    gift: Gift;
    menu: Menu | null;
    senderNickname: string;
    senderTableNumber: number;
  }>>([]);

  const { currentSession, merchantId, tableNumber } = useSessionStore();
  const merchantSlug = params.merchant;
  const currentTableNumber = parseInt(params.table, 10);

  const loadReceivedGifts = useCallback(async () => {
    if (!currentSession?.id) return;

    try {
      const supabase = createClient();
      setIsLoading(true);
      setError(null);

      // Fetch received gifts with menu and sender information
      const { data: gifts, error: giftsError } = await supabase
        .from('gifts')
        .select(`
          *,
          menu:menus(*),
          sender:sender_sessions!sessions(nickname, table_number)
        `)
        .eq('receiver_session_id', currentSession.id)
        .order('created_at', { ascending: false });

      if (giftsError) throw giftsError;

      // Format gifts data
      const formattedGifts = (gifts || []).map((gift: Gift & { menu?: Menu; sender?: { nickname?: string; table_number?: number } }) => ({
        gift,
        menu: gift.menu || null,
        senderNickname: gift.sender?.nickname || `${t('session.table')} ${gift.sender?.table_number || ''}`,
        senderTableNumber: gift.sender?.table_number || 0,
      }));

      setReceivedGifts(formattedGifts);
    } catch (err) {
      console.error('Error loading received gifts:', err);
      setError(t('errors.fetchMessagesFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [currentSession?.id, t]);

  useEffect(() => {
    if (!currentSession || merchantId !== currentSession.merchant_id || tableNumber !== currentSession.table_number) {
      setError('sessionExpired');
      setIsLoading(false);
      return;
    }
    loadReceivedGifts();
  }, [currentSession, merchantId, tableNumber, loadReceivedGifts]);

  const handleBack = () => {
    router.push(`/${merchantSlug}/${currentTableNumber}/dashboard`);
  };

  const formatGiftPrice = (gift: Gift, menu: Menu | null) => {
    if (gift.amount && !menu) {
      return `¥${gift.amount.toLocaleString()}`;
    }
    if (menu) {
      return `¥${menu.price.toLocaleString()}`;
    }
    return '';
  };

  const formatGiftName = (gift: Gift, menu: Menu | null) => {
    if (gift.amount && !menu) {
      return t('gift.pointGift');
    }
    if (menu) {
      return menu.name;
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error === 'sessionExpired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Container maxWidth="sm" className="text-center">
          <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl">
            <h1 className="font-display text-2xl text-soft-white mb-4">
              {t('session.sessionExpired')}
            </h1>
            <p className="text-muted mb-6">
              {t('session.sessionEndedDesc')}
            </p>
            <Button variant="primary" onClick={() => router.push('/')} className="px-8 py-3">
              {t('common.home')}
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-void text-soft-white">
      <Header
        title={t('gift.receivedGifts')}
        showBack
        onBack={handleBack}
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Container maxWidth="md">
          {error && error !== 'sessionExpired' && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
              {error}
            </div>
          )}

          {receivedGifts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-pink/10 flex items-center justify-center border border-neon-pink/30">
                <svg className="w-10 h-10 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4M5 7v10M9 13l4 4M15 13l-4-4M12 8v13M9 17l3 3M15 17l-3 3" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-soft-white mb-2">
                {t('gift.noGifts')}
              </h2>
              <p className="text-muted mb-8">
                {t('gift.noGiftsDescription')}
              </p>
              <Button
                variant="primary"
                onClick={handleBack}
                className="px-8 py-3"
              >
                {t('gift.browseMenu')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedGifts.map((item) => (
                <div
                  key={item.gift.id}
                  className="glass-panel rounded-2xl p-4 border border-steel/30 hover:border-neon-pink/50 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    {/* Gift Icon/Image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center border border-neon-pink/30">
                      {item.menu ? (
                        <span className="text-3xl">
                          {item.menu.name.includes('酒') ? '🍶' : '🍜'}
                        </span>
                      ) : (
                        <svg className="w-8 h-8 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4M5 7v10M9 13l4 4M15 13l-4-4M12 8v13M9 17l3 3M15 17l-3 3" />
                        </svg>
                      )}
                    </div>

                    {/* Gift Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-display text-lg text-soft-white truncate">
                          {formatGiftName(item.gift, item.menu)}
                        </h3>
                        <span className="px-2 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm">
                          {formatGiftPrice(item.gift, item.menu)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0M4 7v10M4 7l4-4M12 7l-4 4M12 17l4-4M12 7H4m0 0v10M12 7h8m-8 0l-4 4m4-4v4" />
                        </svg>
                        <span>{item.senderNickname}</span>
                        <span>•</span>
                        <span>{t('gift.table', { number: item.senderTableNumber })}</span>
                      </div>

                      {item.gift.message && (
                        <div className="p-3 rounded-xl bg-midnight/50 border border-steel/20">
                          <p className="text-sm text-soft-white italic">
                            &quot;{item.gift.message}&quot;
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-muted">
                        {new Date(item.gift.created_at).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                          item.gift.status === 'completed'
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                            : item.gift.status === 'pending'
                              ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}
                      >
                        {item.gift.status === 'completed' && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {item.gift.status === 'pending' && (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {item.gift.status === 'failed' && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {item.gift.status === 'completed' && t('gift.received')}
                        {item.gift.status === 'pending' && t('gift.pending')}
                        {item.gift.status === 'failed' && t('gift.failed')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
