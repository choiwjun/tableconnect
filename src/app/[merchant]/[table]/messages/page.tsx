'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Button, Spinner, Header } from '@/components/ui';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import type { Message, Session } from '@/types/database';

export default function MessagesPage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{
    sessionId: string;
    partnerNickname: string;
    partnerTableNumber: number;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    partnerSession: Session;
  }>>([]);

  const { currentSession, merchantId, tableNumber } = useSessionStore();
  const merchantSlug = params.merchant;
  const currentTableNumber = parseInt(params.table, 10);

  useEffect(() => {
    if (!currentSession || merchantId !== currentSession.merchant_id || tableNumber !== currentSession.table_number) {
      router.replace(`/${merchantSlug}/${currentTableNumber}/profile`);
      return;
    }
    loadConversations();
  }, [currentSession, merchantId, tableNumber, merchantSlug, currentTableNumber, router]);

  const loadConversations = async () => {
    if (!currentSession?.id) return;

    try {
      const supabase = createClient();
      setIsLoading(true);
      setError(null);

      // Fetch all messages where current session is sender or receiver
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_session_id!sessions(nickname, table_number),
          receiver:receiver_session_id!sessions(nickname, table_number)
        `)
        .or(`sender_session_id.eq.${currentSession.id},receiver_session_id.eq.${currentSession.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation partner
      const conversationsMap = new Map<string, {
        sessionId: string;
        partnerNickname: string;
        partnerTableNumber: number;
        lastMessage: string;
        lastMessageTime: string;
        unreadCount: number;
        partnerSession: Session;
      }>();

      messages?.forEach((message: Message) => {
        const isSender = message.sender_session_id === currentSession.id;
        const partnerSessionId = isSender ? message.receiver_session_id : message.sender_session_id;
        const partnerData = isSender ? message.receiver : message.sender;

        if (!partnerData) return;

        const existing = conversationsMap.get(partnerSessionId);
        if (existing) {
          // Update last message and unread count
          if (!message.is_read && !isSender) {
            existing.unreadCount += 1;
          }
          if (message.created_at > existing.lastMessageTime) {
            existing.lastMessage = message.content;
            existing.lastMessageTime = message.created_at;
          }
        } else {
          // Create new conversation
          conversationsMap.set(partnerSessionId, {
            sessionId: partnerSessionId,
            partnerNickname: partnerData.nickname || `${t('session.table')} ${partnerData.table_number}`,
            partnerTableNumber: partnerData.table_number,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: !message.is_read && !isSender ? 1 : 0,
            partnerSession: partnerData as unknown as Session,
          });
        }
      });

      // Convert to array and sort by last message time
      setConversations(Array.from(conversationsMap.values()).sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      ));
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(t('errors.fetchMessagesFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversation: typeof conversations[0]) => {
    router.push(`/${merchantSlug}/${currentTableNumber}/chat/${conversation.sessionId}`);
  };

  const formatLastMessage = (message: string) => {
    if (message.length > 30) {
      return message.substring(0, 30) + '...';
    }
    return message;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('chat.justNow');
    if (diffMins < 60) return `${diffMins}${t('chat.minutesAgo')}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}${t('chat.hoursAgo')}`;
    return `${Math.floor(diffMins / 1440)}${t('chat.daysAgo')}`;
  };

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
            <h1 className="font-display text-2xl text-soft-white mb-4">{t('common.error')}</h1>
            <p className="text-muted mb-6">{error}</p>
            <Button variant="primary" onClick={() => router.push(`/${merchantSlug}/${currentTableNumber}/dashboard`)}>
              {t('common.back')}
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-void text-soft-white">
      <Header
        title={t('dashboard.messages')}
        showBackButton
        onBack={() => router.push(`/${merchantSlug}/${currentTableNumber}/dashboard`)}
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Container maxWidth="md">
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                <svg className="w-10 h-10 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-soft-white mb-2">
                {t('chat.noMessages')}
              </h2>
              <p className="text-muted mb-8">
                {t('chat.startFirst')}
              </p>
              <Button
                variant="primary"
                onClick={() => router.push(`/${merchantSlug}/${currentTableNumber}/dashboard`)}
              >
                {t('dashboard.startFirst')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <button
                  key={conversation.sessionId}
                  onClick={() => handleConversationClick(conversation)}
                  className="w-full glass-panel rounded-2xl p-4 border border-steel/30 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center border border-neon-pink/30">
                        <span className="font-display text-lg text-neon-pink">
                          {conversation.partnerTableNumber}
                        </span>
                      </div>
                      {/* Unread indicator */}
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neon-pink text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-neon-pink/40">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Conversation info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display text-lg text-soft-white truncate group-hover:text-neon-cyan transition-colors">
                          {conversation.partnerNickname}
                        </h3>
                        <span className="text-xs text-muted whitespace-nowrap">
                          {formatRelativeTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-muted truncate">
                        {formatLastMessage(conversation.lastMessage)}
                      </p>
                    </div>

                    {/* Arrow icon */}
                    <svg
                      className="w-5 h-5 text-muted group-hover:text-neon-cyan transition-colors flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
