'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Spinner, Modal } from '@/components/ui';
import { GiftFlow } from '@/components/gift';
import { BlockButton, ReportModal } from '@/components/safety';
import { useRealtimeMessages } from '@/lib/hooks/useRealtime';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useTranslation } from '@/lib/i18n/context';
import type { Message } from '@/types/database';

interface ChatRoomProps {
  sessionId: string;
  partnerId: string;
  partnerNickname: string;
  partnerTableNumber: number;
  isDemo?: boolean;
}

export function ChatRoom({
  sessionId,
  partnerId,
  partnerNickname,
  partnerTableNumber,
  isDemo = false,
}: ChatRoomProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [showGiftFlow, setShowGiftFlow] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { merchantId } = useSessionStore();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    // Skip API call in demo mode
    if (isDemo) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      const response = await fetch(
        `/api/messages?sessionId=${sessionId}&partnerId=${partnerId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const { messages: fetchedMessages } = await response.json();
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(t('chat.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, partnerId, t, isDemo]);

  // Handle new message from realtime subscription
  const handleNewMessage = useCallback(
    (newMessage: Record<string, unknown>) => {
      const message = newMessage as unknown as Message;
      // Only add messages from this conversation
      if (
        (message.sender_session_id === partnerId &&
          message.receiver_session_id === sessionId) ||
        (message.sender_session_id === sessionId &&
          message.receiver_session_id === partnerId)
      ) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    },
    [sessionId, partnerId]
  );

  // Subscribe to realtime messages
  useRealtimeMessages(sessionId, handleNewMessage, true);

  // Send message
  const handleSend = useCallback(
    async (content: string) => {
      // In demo mode, add message locally without API call
      if (isDemo) {
        const demoMessage: Message = {
          id: `demo-msg-${Date.now()}`,
          sender_session_id: sessionId,
          receiver_session_id: partnerId,
          content,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, demoMessage]);
        return;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderSessionId: sessionId,
          receiverSessionId: partnerId,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add message with duplicate check (realtime may also add it)
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
    },
    [sessionId, partnerId, isDemo]
  );

  // Load messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreMenu) setShowMoreMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMoreMenu]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-dark/50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-muted mt-4 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-dark/50">
        <div className="glass-panel rounded-2xl p-8 text-center border border-steel/30 max-w-sm mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-muted mb-4">{error}</p>
          <button
            onClick={fetchMessages}
            className="px-6 py-2 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/30 transition-all"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="glass-panel flex items-center justify-between p-4 border-b border-steel/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* Partner Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center border border-neon-pink/30">
              <span className="font-display text-lg text-neon-pink">
                {partnerTableNumber}
              </span>
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-background-dark" />
          </div>
          <div>
            <h2 className="font-medium text-soft-white">{partnerNickname}</h2>
            <p className="text-xs text-muted">{t('chat.tableNumber', { number: partnerTableNumber })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gift button */}
          <button
            onClick={() => setShowGiftFlow(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 text-neon-pink hover:from-neon-pink/30 hover:to-neon-purple/30 transition-all shadow-lg shadow-neon-pink/10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <span className="text-sm font-medium">{t('chat.gift')}</span>
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(!showMoreMenu);
              }}
              className="p-2.5 rounded-full hover:bg-steel/30 transition-colors border border-transparent hover:border-steel/30"
            >
              <svg
                className="w-5 h-5 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showMoreMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-xl overflow-hidden z-50 border border-steel/30 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowReportModal(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {t('safety.report')}
                </button>
                <div className="border-t border-steel/20" />
                <div className="px-4 py-3 flex items-center gap-3 hover:bg-yellow-500/10 transition-colors">
                  <BlockButton
                    targetSessionId={partnerId}
                    targetNickname={partnerNickname}
                    currentSessionId={sessionId}
                  />
                  <span className="text-sm text-muted">{t('safety.block')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background-dark/50 to-background-dark">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-16">
            <div className="glass-panel rounded-2xl p-8 border border-steel/30 max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                <svg
                  className="w-8 h-8 text-neon-cyan"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-soft-white mb-2">
                {t('chat.startConversation', { nickname: partnerNickname })}
              </p>
              <p className="text-muted text-sm">
                {t('chat.sendFirstMessage')}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              timestamp={message.created_at}
              isMine={message.sender_session_id === sessionId}
              senderNickname={
                message.sender_session_id === partnerId
                  ? partnerNickname
                  : undefined
              }
              isRead={message.is_read}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="glass-panel p-4 border-t border-steel/30 backdrop-blur-xl">
        <MessageInput onSend={handleSend} placeholder={t('chat.messagePlaceholder')} />
      </div>

      {/* Gift Flow Modal */}
      {showGiftFlow && merchantId && (
        <Modal isOpen={showGiftFlow} onClose={() => setShowGiftFlow(false)}>
          <GiftFlow
            merchantId={merchantId}
            senderSessionId={sessionId}
            receiverSessionId={partnerId}
            receiverNickname={partnerNickname}
            receiverTableNumber={partnerTableNumber}
            onClose={() => setShowGiftFlow(false)}
          />
        </Modal>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetSessionId={partnerId}
        targetNickname={partnerNickname}
        currentSessionId={sessionId}
      />
    </div>
  );
}
