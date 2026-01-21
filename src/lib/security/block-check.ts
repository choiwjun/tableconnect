/**
 * Block Check Utilities
 * 차단된 사용자 체크 및 필터링
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if a session is blocked by another session
 * @returns true if blocked (should deny access)
 */
export async function isBlocked(
  supabase: SupabaseClient,
  blockerSessionId: string,
  blockedSessionId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_session_id', blockerSessionId)
    .eq('blocked_session_id', blockedSessionId)
    .single();

  return !!data;
}

/**
 * Check if either session has blocked the other (mutual block check)
 * @returns true if either has blocked the other
 */
export async function isMutuallyBlocked(
  supabase: SupabaseClient,
  sessionId1: string,
  sessionId2: string
): Promise<boolean> {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_session_id.eq.${sessionId1},blocked_session_id.eq.${sessionId2}),and(blocker_session_id.eq.${sessionId2},blocked_session_id.eq.${sessionId1})`
    )
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Get list of session IDs that a user has blocked
 */
export async function getBlockedSessionIds(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('blocks')
    .select('blocked_session_id')
    .eq('blocker_session_id', sessionId);

  return (data ?? []).map((b) => b.blocked_session_id);
}

/**
 * Get list of session IDs that have blocked the user
 */
export async function getBlockerSessionIds(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('blocks')
    .select('blocker_session_id')
    .eq('blocked_session_id', sessionId);

  return (data ?? []).map((b) => b.blocker_session_id);
}

/**
 * Get all blocked session IDs (both directions)
 * Returns sessions that user blocked + sessions that blocked user
 */
export async function getAllBlockedSessionIds(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('blocks')
    .select('blocker_session_id, blocked_session_id')
    .or(`blocker_session_id.eq.${sessionId},blocked_session_id.eq.${sessionId}`);

  if (!data) return [];

  const blockedIds = new Set<string>();
  for (const block of data) {
    if (block.blocker_session_id === sessionId) {
      blockedIds.add(block.blocked_session_id);
    } else {
      blockedIds.add(block.blocker_session_id);
    }
  }

  return Array.from(blockedIds);
}
