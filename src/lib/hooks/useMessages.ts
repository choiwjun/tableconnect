'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/database';
import { DEFAULT_PAGE_SIZE } from '@/lib/utils/constants';

interface UseMessagesOptions {
  sessionId: string;
  partnerSessionId?: string;
  pageSize?: number;
}

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  sendMessage: (content: string, receiverSessionId: string) => Promise<Message | null>;
  loadMore: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing messages
 */
export function useMessages({
  sessionId,
  partnerSessionId,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const supabase = createClient();

  // Fetch messages
  const fetchMessages = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!sessionId) return;

      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

        // If partner is specified, filter to conversation
        if (partnerSessionId) {
          query = query.or(
            `and(sender_session_id.eq.${sessionId},receiver_session_id.eq.${partnerSessionId}),and(sender_session_id.eq.${partnerSessionId},receiver_session_id.eq.${sessionId})`
          );
        } else {
          // Get all messages for this session
          query = query.or(
            `sender_session_id.eq.${sessionId},receiver_session_id.eq.${sessionId}`
          );
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (data) {
          const fetchedMessages = data as Message[];
          setHasMore(fetchedMessages.length === pageSize);

          if (append) {
            setMessages((prev) => [...prev, ...fetchedMessages]);
          } else {
            setMessages(fetchedMessages);
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('メッセージの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, partnerSessionId, pageSize, supabase]
  );

  // Send a message
  const sendMessage = useCallback(
    async (content: string, receiverSessionId: string): Promise<Message | null> => {
      if (!sessionId) {
        setError('セッションが見つかりません');
        return null;
      }

      try {
        const { data, error: sendError } = await supabase
          .from('messages')
          .insert({
            sender_session_id: sessionId,
            receiver_session_id: receiverSessionId,
            content,
            is_read: false,
          })
          .select()
          .single();

        if (sendError) throw sendError;

        if (data) {
          const newMessage = data as Message;
          setMessages((prev) => [newMessage, ...prev]);
          return newMessage;
        }

        return null;
      } catch (err) {
        console.error('Error sending message:', err);
        setError('メッセージの送信に失敗しました');
        return null;
      }
    },
    [sessionId, supabase]
  );

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage, true);
  }, [hasMore, isLoading, page, fetchMessages]);

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId: string) => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', messageId)
          .eq('receiver_session_id', sessionId);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, is_read: true } : msg
          )
        );
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    },
    [sessionId, supabase]
  );

  // Refresh messages
  const refresh = useCallback(async () => {
    setPage(0);
    await fetchMessages(0, false);
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchMessages(0);
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    sendMessage,
    loadMore,
    markAsRead,
    refresh,
  };
}
