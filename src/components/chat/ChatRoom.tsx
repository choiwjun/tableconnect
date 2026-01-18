'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Spinner } from '@/components/ui';
import { useRealtimeMessages } from '@/lib/hooks/useRealtime';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const { message } = await response.json();
      setMessages((prev) => [...prev, message]);
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
      <div className="flex items-center gap-3 p-4 border-b border-steel/30">
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
    </div>
  );
}
