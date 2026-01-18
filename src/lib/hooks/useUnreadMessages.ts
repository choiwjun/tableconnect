'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from './useRealtime';

interface UnreadCounts {
  totalUnread: number;
  unreadBySender: Record<string, number>;
}

/**
 * Hook for managing unread message counts
 */
export function useUnreadMessages(sessionId: string | null) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    totalUnread: 0,
    unreadBySender: {},
  });
  const [loading, setLoading] = useState(true);

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!sessionId) {
      setUnreadCounts({ totalUnread: 0, unreadBySender: {} });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/messages/unread?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCounts({
          totalUnread: data.totalUnread,
          unreadBySender: data.unreadBySender,
        });
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Subscribe to new messages via realtime
  useRealtime({
    table: 'messages',
    event: 'INSERT',
    filter: sessionId ? `receiver_session_id=eq.${sessionId}` : undefined,
    onInsert: (newMessage) => {
      // Increment unread count for this sender
      const senderId = (newMessage as { sender_session_id: string }).sender_session_id;
      setUnreadCounts((prev) => ({
        totalUnread: prev.totalUnread + 1,
        unreadBySender: {
          ...prev.unreadBySender,
          [senderId]: (prev.unreadBySender[senderId] || 0) + 1,
        },
      }));
    },
    enabled: !!sessionId,
  });

  // Mark messages from a sender as read
  const markAsRead = useCallback(async (senderSessionId: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/messages/unread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          senderSessionId,
        }),
      });

      if (response.ok) {
        setUnreadCounts((prev) => {
          const senderCount = prev.unreadBySender[senderSessionId] || 0;
          const newUnreadBySender = { ...prev.unreadBySender };
          delete newUnreadBySender[senderSessionId];

          return {
            totalUnread: Math.max(0, prev.totalUnread - senderCount),
            unreadBySender: newUnreadBySender,
          };
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [sessionId]);

  // Get unread count for a specific sender
  const getUnreadCount = useCallback(
    (senderSessionId: string) => {
      return unreadCounts.unreadBySender[senderSessionId] || 0;
    },
    [unreadCounts.unreadBySender]
  );

  return {
    totalUnread: unreadCounts.totalUnread,
    unreadBySender: unreadCounts.unreadBySender,
    getUnreadCount,
    markAsRead,
    refetch: fetchUnreadCounts,
    loading,
  };
}
