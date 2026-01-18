'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocalStorage } from './useLocalStorage';
import type { Session } from '@/types/database';
import { SESSION_TTL_MS } from '@/lib/utils/constants';

interface UseSessionReturn {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isExpired: boolean;
  createSession: (merchantId: string, tableNumber: number) => Promise<Session | null>;
  joinSession: (nickname: string) => Promise<boolean>;
  endSession: () => Promise<void>;
  checkExpiry: () => boolean;
}

/**
 * Hook for managing user session
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId, removeSessionId] = useLocalStorage<string | null>(
    'tableconnect_session_id',
    null
  );

  const supabase = createClient();

  // Check if session is expired
  const checkExpiry = useCallback(() => {
    if (!session) return true;
    const expiresAt = new Date(session.expires_at);
    return expiresAt < new Date();
  }, [session]);

  const isExpired = checkExpiry();

  // Fetch session by ID
  const fetchSession = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Check if session is expired
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date() || !data.is_active) {
          // Session expired or inactive
          removeSessionId();
          setSession(null);
          return null;
        }
        setSession(data as Session);
        return data as Session;
      }

      return null;
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('セッションの取得に失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, removeSessionId]);

  // Create a new session
  const createSession = useCallback(
    async (merchantId: string, tableNumber: number): Promise<Session | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

        const { data, error: createError } = await supabase
          .from('sessions')
          .insert({
            merchant_id: merchantId,
            table_number: tableNumber,
            is_active: true,
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (createError) throw createError;

        if (data) {
          setSession(data as Session);
          setSessionId(data.id);
          return data as Session;
        }

        return null;
      } catch (err) {
        console.error('Error creating session:', err);
        setError('セッションの作成に失敗しました');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, setSessionId]
  );

  // Join session with nickname
  const joinSession = useCallback(
    async (nickname: string): Promise<boolean> => {
      if (!session) {
        setError('セッションが見つかりません');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: updateError } = await supabase
          .from('sessions')
          .update({ nickname })
          .eq('id', session.id)
          .select()
          .single();

        if (updateError) throw updateError;

        if (data) {
          setSession(data as Session);
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error joining session:', err);
        setError('セッションへの参加に失敗しました');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session, supabase]
  );

  // End session
  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);

      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', session.id);

      setSession(null);
      removeSessionId();
    } catch (err) {
      console.error('Error ending session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session, supabase, removeSessionId]);

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else {
      setIsLoading(false);
    }
  }, [sessionId, fetchSession]);

  // Set up expiry check interval
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      if (checkExpiry()) {
        endSession();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, checkExpiry, endSession]);

  return {
    session,
    isLoading,
    error,
    isExpired,
    createSession,
    joinSession,
    endSession,
    checkExpiry,
  };
}
