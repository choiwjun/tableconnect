'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner, Header } from '@/components/ui';
import { TableList } from '@/components/tables';
import { ChatRoom } from '@/components/chat';
import { useSessionStore } from '@/lib/stores/sessionStore';
import type { ActiveTable } from '@/app/api/tables/route';

export default function ChatPage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<ActiveTable | null>(null);

  const { currentSession, merchantId } = useSessionStore();

  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);

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

  const handleSelectTable = useCallback((table: ActiveTable) => {
    setSelectedPartner(table);
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentSession || !merchantId) {
    return null;
  }

  // Get unread sessions for highlighting
  const unreadSessions = new Set<string>();
  // Note: In a real implementation, you'd track which sessions have unread messages

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={
          selectedPartner
            ? selectedPartner.nickname || `テーブル ${selectedPartner.tableNumber}`
            : currentSession.nickname || `テーブル ${currentSession.table_number}`
        }
        onBack={handleBack}
        showBack={true}
      />

      <main className="flex-1 flex flex-col">
        {selectedPartner ? (
          <ChatRoom
            sessionId={currentSession.id}
            partnerId={selectedPartner.sessionId}
            partnerNickname={selectedPartner.nickname || `テーブル ${selectedPartner.tableNumber}`}
            partnerTableNumber={selectedPartner.tableNumber}
          />
        ) : (
          <Container className="py-6 flex-1">
            <div className="mb-6">
              <div className="glass rounded-xl p-4 mb-4">
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
                      テーブル {currentSession.table_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <TableList
              merchantId={merchantId}
              currentSessionId={currentSession.id}
              onSelectTable={handleSelectTable}
              unreadSessions={unreadSessions}
            />
          </Container>
        )}
      </main>
    </div>
  );
}
