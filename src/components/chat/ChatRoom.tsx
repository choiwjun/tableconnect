'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Spinner, Modal } from '@/components/ui';
import { GiftFlow } from '@/components/gift';
import { BlockButton, ReportModal } from '@/components/safety';
import { useRealtimeMessages } from '@/lib/hooks/useRealtime';
import { useSessionStore } from '@/lib/stores/sessionStore';
import type { Message } from '@/types/database';

interface ChatRoomProps {
  sessionId: string;
  partnerId: string;
  partnerNickname: string;
  partnerTableNumber: number;
}

export function ChatRoom({
  sessionId,
  partnerId,
  partnerNickname,
  partnerTableNumber,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      setError('メッセージの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, partnerId]);

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
    [sessionId, partnerId]
  );

  // Load messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">{error}</p>
          <button
            onClick={fetchMessages}
            className="text-neon-cyan hover:underline"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-steel/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center border border-neon-pink/30">
            <span className="font-display text-sm text-neon-pink">
              {partnerTableNumber}
            </span>
          </div>
          <div>
            <h2 className="font-medium text-soft-white">{partnerNickname}</h2>
            <p className="text-xs text-muted">テーブル {partnerTableNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gift button */}
          <button
            onClick={() => setShowGiftFlow(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 text-neon-pink hover:from-neon-pink/30 hover:to-neon-purple/30 transition-all"
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
            <span className="text-sm font-medium">ギフト</span>
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-full hover:bg-steel/30 transition-colors"
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
              <div className="absolute right-0 top-full mt-2 w-40 glass rounded-lg overflow-hidden z-10">
                <button
                  onClick={() => {
                    setShowReportModal(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-muted hover:bg-steel/30 hover:text-soft-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  報告する
                </button>
                <div className="px-4 py-2 flex items-center gap-2">
                  <BlockButton
                    targetSessionId={partnerId}
                    targetNickname={partnerNickname}
                    currentSessionId={sessionId}
                  />
                  <span className="text-sm text-muted">ブロック</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div>
              <p className="text-muted">
                {partnerNickname}さんとの会話を始めましょう
              </p>
              <p className="text-muted text-sm mt-1">
                最初のメッセージを送信してください
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
      <div className="p-4 border-t border-steel/30">
        <MessageInput onSend={handleSend} />
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
