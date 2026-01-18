'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}

interface UseRealtimeOptions<T> {
  table: string;
  event?: PostgresChangeEvent;
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T, old: T) => void;
  onDelete?: (payload: T) => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to Supabase Realtime changes
 */
export function useRealtime<T extends Record<string, unknown>>({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(
    (payload: RealtimePayload<T>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          if (onInsert && newRecord) {
            onInsert(newRecord as T);
          }
          break;
        case 'UPDATE':
          if (onUpdate && newRecord && oldRecord) {
            onUpdate(newRecord as T, oldRecord as T);
          }
          break;
        case 'DELETE':
          if (onDelete && oldRecord) {
            onDelete(oldRecord as T);
          }
          break;
      }
    },
    [onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled) return;

    const channelName = `${table}-changes-${Date.now()}`;

    // Build filter config
    const filterConfig = filter
      ? { event, schema: 'public' as const, table, filter }
      : { event, schema: 'public' as const, table };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as 'system',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filterConfig as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleChange as any
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, table, event, filter, enabled, handleChange]);
}

/**
 * Hook for subscribing to messages in realtime
 */
export function useRealtimeMessages(
  sessionId: string,
  onNewMessage: (message: Record<string, unknown>) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'messages',
    event: 'INSERT',
    filter: `receiver_session_id=eq.${sessionId}`,
    onInsert: onNewMessage,
    enabled: enabled && !!sessionId,
  });
}

/**
 * Hook for subscribing to gifts in realtime
 */
export function useRealtimeGifts(
  sessionId: string,
  onNewGift: (gift: Record<string, unknown>) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'gifts',
    event: 'INSERT',
    filter: `receiver_session_id=eq.${sessionId}`,
    onInsert: onNewGift,
    enabled: enabled && !!sessionId,
  });
}
