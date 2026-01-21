/**
 * Message Rate Limiting
 * 메시지 스팸/스토킹 방지를 위한 레이트 리밋
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Rate limit settings
const MESSAGE_COOLDOWN_MS = 3000; // 3 seconds between messages to same recipient
const MESSAGE_WINDOW_MS = 60000; // 1 minute window
const MAX_MESSAGES_PER_WINDOW = 20; // Max messages per minute to same recipient
const MAX_TOTAL_MESSAGES_PER_HOUR = 100; // Max total messages per hour

// In-memory store for rate limiting (single instance)
// For production with multiple instances, use Redis
const messageRateLimitStore = new Map<
  string,
  { count: number; lastMessageAt: number; resetAt: number }
>();

interface MessageRateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  reason?: string;
}

/**
 * Check message rate limit
 * @param senderSessionId - The sender's session ID
 * @param receiverSessionId - The receiver's session ID
 */
export function checkMessageRateLimit(
  senderSessionId: string,
  receiverSessionId: string
): MessageRateLimitResult {
  const now = Date.now();
  const pairKey = `msg:${senderSessionId}:${receiverSessionId}`;
  const totalKey = `msg:total:${senderSessionId}`;

  // Cleanup old entries periodically
  if (messageRateLimitStore.size > 10000) {
    const cutoff = now - 3600000; // 1 hour
    const keysToDelete: string[] = [];
    messageRateLimitStore.forEach((v, k) => {
      if (v.resetAt < cutoff) keysToDelete.push(k);
    });
    keysToDelete.forEach((k) => messageRateLimitStore.delete(k));
  }

  // Check pair-specific rate limit
  const pairRecord = messageRateLimitStore.get(pairKey);

  if (pairRecord) {
    // Check cooldown (min time between messages)
    const timeSinceLastMessage = now - pairRecord.lastMessageAt;
    if (timeSinceLastMessage < MESSAGE_COOLDOWN_MS) {
      return {
        allowed: false,
        retryAfterMs: MESSAGE_COOLDOWN_MS - timeSinceLastMessage,
        reason: 'cooldown',
      };
    }

    // Check window limit
    if (now < pairRecord.resetAt) {
      if (pairRecord.count >= MAX_MESSAGES_PER_WINDOW) {
        return {
          allowed: false,
          retryAfterMs: pairRecord.resetAt - now,
          reason: 'window_limit',
        };
      }
    } else {
      // Window expired, reset
      messageRateLimitStore.set(pairKey, {
        count: 1,
        lastMessageAt: now,
        resetAt: now + MESSAGE_WINDOW_MS,
      });
      return { allowed: true };
    }

    // Update count
    pairRecord.count++;
    pairRecord.lastMessageAt = now;
    return { allowed: true };
  }

  // First message to this recipient
  messageRateLimitStore.set(pairKey, {
    count: 1,
    lastMessageAt: now,
    resetAt: now + MESSAGE_WINDOW_MS,
  });

  // Check total hourly limit
  const totalRecord = messageRateLimitStore.get(totalKey);
  if (totalRecord) {
    if (now < totalRecord.resetAt) {
      if (totalRecord.count >= MAX_TOTAL_MESSAGES_PER_HOUR) {
        return {
          allowed: false,
          retryAfterMs: totalRecord.resetAt - now,
          reason: 'hourly_limit',
        };
      }
      totalRecord.count++;
    } else {
      // Reset hourly counter
      messageRateLimitStore.set(totalKey, {
        count: 1,
        lastMessageAt: now,
        resetAt: now + 3600000, // 1 hour
      });
    }
  } else {
    messageRateLimitStore.set(totalKey, {
      count: 1,
      lastMessageAt: now,
      resetAt: now + 3600000,
    });
  }

  return { allowed: true };
}

/**
 * Database-backed rate limit check (more reliable for distributed systems)
 * Checks recent message count from database
 */
export async function checkMessageRateLimitDB(
  supabase: SupabaseClient,
  senderSessionId: string,
  receiverSessionId: string
): Promise<MessageRateLimitResult> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - MESSAGE_WINDOW_MS);

  // Check messages to this specific recipient in the last minute
  const { count: recentCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_session_id', senderSessionId)
    .eq('receiver_session_id', receiverSessionId)
    .gte('created_at', oneMinuteAgo.toISOString());

  if ((recentCount ?? 0) >= MAX_MESSAGES_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterMs: MESSAGE_WINDOW_MS,
      reason: 'window_limit',
    };
  }

  // Check last message time for cooldown
  const { data: lastMessage } = await supabase
    .from('messages')
    .select('created_at')
    .eq('sender_session_id', senderSessionId)
    .eq('receiver_session_id', receiverSessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastMessage) {
    const lastMessageTime = new Date(lastMessage.created_at).getTime();
    const timeSinceLastMessage = now.getTime() - lastMessageTime;

    if (timeSinceLastMessage < MESSAGE_COOLDOWN_MS) {
      return {
        allowed: false,
        retryAfterMs: MESSAGE_COOLDOWN_MS - timeSinceLastMessage,
        reason: 'cooldown',
      };
    }
  }

  return { allowed: true };
}

/**
 * Get rate limit error message
 */
export function getMessageRateLimitError(
  reason: string,
  retryAfterMs: number,
  locale: string = 'ja'
): string {
  const seconds = Math.ceil(retryAfterMs / 1000);

  const messages: Record<string, Record<string, string>> = {
    ja: {
      cooldown: `メッセージの送信は${seconds}秒後に可能です`,
      window_limit: 'メッセージの送信制限に達しました。しばらくお待ちください',
      hourly_limit: '1時間のメッセージ送信上限に達しました',
    },
    en: {
      cooldown: `Please wait ${seconds} seconds before sending another message`,
      window_limit: 'Message limit reached. Please wait a moment',
      hourly_limit: 'Hourly message limit reached',
    },
    ko: {
      cooldown: `${seconds}초 후에 메시지를 보낼 수 있습니다`,
      window_limit: '메시지 전송 제한에 도달했습니다. 잠시 기다려주세요',
      hourly_limit: '시간당 메시지 전송 한도에 도달했습니다',
    },
  };

  const localeMessages = messages[locale] || messages['ja'];
  return localeMessages[reason] || localeMessages['cooldown'];
}
