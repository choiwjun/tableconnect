'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner, Header } from '@/components/ui';
import { TableList } from '@/components/tables';
import { ChatRoom } from '@/components/chat';
import { JoinRequestListener } from '@/components/join';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useTranslation } from '@/lib/i18n/context';
import type { ActiveTable } from '@/app/api/tables/route';

// Demo mode mock tables data
const mockDemoTables: ActiveTable[] = [
  { sessionId: 'demo-table-1', tableNumber: 8, nickname: 'Yuki', createdAt: new Date().toISOString() },
  { sessionId: 'demo-table-2', tableNumber: 14, nickname: 'Ken', createdAt: new Date().toISOString() },
  { sessionId: 'demo-table-3', tableNumber: 2, nickname: 'Sato', createdAt: new Date().toISOString() },
  { sessionId: 'demo-table-4', tableNumber: 5, nickname: 'Akiko', createdAt: new Date().toISOString() },
];

export default function ChatPage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<ActiveTable | null>(null);

  const { currentSession, merchantId } = useSessionStore();

  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);

  // Check if this is demo mode
  const isDemo = merchantSlug === 'demo';

  // Verify session on mount
  useEffect(() => {
    const sessionId = localStorage.getItem('tableconnect_session_id');

    if (!sessionId || !currentSession) {
      // Redirect to profile page if no session
      router.push(`/${merchantSlug}/${tableNumber}/profile`);
      return;
    }

    setIsLoading(false);
  }, [currentSession, merchantSlug, tableNumber, router]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectTable = useCallback((table: any) => {
    // Convert to ActiveTable format if needed
    if ('sessionId' in table) {
      setSelectedPartner(table as ActiveTable);
    } else {
      setSelectedPartner({
        sessionId: table.id,
        tableNumber: table.table_number,
        nickname: table.nickname,
        createdAt: table.created_at,
      });
    }
  }, []);

  const handleBack = useCallback(() => {
    if (selectedPartner) {
      setSelectedPartner(null);
    } else {
      router.push('/');
    }
  }, [selectedPartner, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        {/* Ambient Background */}
        <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentSession || (!merchantId && !isDemo)) {
    return null;
  }

  // Get unread sessions for highlighting
  const unreadSessions = new Set<string>();
  // Note: In a real implementation, you'd track which sessions have unread messages

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />

      {/* Join Request Listener - Real-time join request receiving */}
      {!isDemo && currentSession && (
        <JoinRequestListener
          sessionId={currentSession.id}
          tableNumber={currentSession.table_number}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          title={
            selectedPartner
              ? selectedPartner.nickname || t('chat.tableNumber', { number: selectedPartner.tableNumber })
              : currentSession.nickname || t('chat.tableNumber', { number: currentSession.table_number })
          }
          onBack={handleBack}
          showBack={true}
        />

        <main className="flex-1 flex flex-col">
          {selectedPartner ? (
            <ChatRoom
              sessionId={currentSession.id}
              partnerId={selectedPartner.sessionId}
              partnerNickname={selectedPartner.nickname || t('chat.tableNumber', { number: selectedPartner.tableNumber })}
              partnerTableNumber={selectedPartner.tableNumber}
              isDemo={isDemo}
            />
          ) : (
            <Container className="py-6 flex-1 stagger-children">
              {/* Current User Card */}
              <div className="mb-6">
                <div className="glass-panel rounded-xl p-4 mb-4 border border-steel/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center border border-neon-cyan/30">
                      <span className="font-display text-lg text-neon-cyan">
                        {currentSession.table_number}
                      </span>
                    </div>
                    <div>
                      <p className="text-soft-white font-medium">
                        {currentSession.nickname}
                      </p>
                      <p className="text-sm text-muted">
                        {t('chat.tableNumber', { number: currentSession.table_number })}
                      </p>
                    </div>
                    {/* Online Status */}
                    <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400">{t('dashboard.online')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-soft-white">
                  {t('tables.activeTables')}
                </h2>
              </div>

              <TableList
                merchantId={merchantId || 'demo'}
                currentSessionId={currentSession.id}
                onSelectTable={handleSelectTable}
                unreadSessions={unreadSessions}
                demoTables={isDemo ? mockDemoTables : undefined}
              />
            </Container>
          )}
        </main>
      </div>
    </div>
  );
}
