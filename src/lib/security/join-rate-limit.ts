/**
 * Join Table Rate Limiting
 * 합석 요청 악용 방지를 위한 rate limiting
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Constants
export const JOIN_REQUEST_COOLDOWN_MS = 5 * 60 * 1000; // 5분 쿨다운
export const REJECTION_COOLDOWN_MS = 30 * 60 * 1000; // 거절 후 30분 재요청 금지
export const MULTIPLE_REJECTION_COOLDOWN_MS = 60 * 60 * 1000; // 3회 거절 시 1시간 잠금
export const MAX_REJECTIONS_BEFORE_LOCKOUT = 3;

interface CooldownCheckResult {
  allowed: boolean;
  reason?: 'request_cooldown' | 'rejection_cooldown' | 'multiple_rejection' | 'blocked';
  retryAfterMs?: number;
  message?: string;
}

/**
 * 합석 요청이 가능한지 확인
 */
export async function checkJoinRequestAllowed(
  supabase: SupabaseClient,
  fromSessionId: string,
  toSessionId: string
): Promise<CooldownCheckResult> {
  const now = new Date();

  // 1. 차단 관계 확인
  const { data: blockData } = await supabase
    .from('blocks')
    .select('id')
    .or(`and(blocker_session_id.eq.${fromSessionId},blocked_session_id.eq.${toSessionId}),and(blocker_session_id.eq.${toSessionId},blocked_session_id.eq.${fromSessionId})`)
    .limit(1);

  if (blockData && blockData.length > 0) {
    return {
      allowed: false,
      reason: 'blocked',
      message: 'この相手には合席リクエストを送れません',
    };
  }

  // 2. 전체 잠금 상태 확인 (3회 거절로 인한 1시간 잠금)
  const { data: lockoutData } = await supabase
    .from('join_cooldowns')
    .select('expires_at')
    .eq('session_id', fromSessionId)
    .eq('cooldown_type', 'multiple_rejection')
    .is('target_session_id', null)
    .gt('expires_at', now.toISOString())
    .limit(1);

  if (lockoutData && lockoutData.length > 0) {
    const expiresAt = new Date(lockoutData[0].expires_at);
    return {
      allowed: false,
      reason: 'multiple_rejection',
      retryAfterMs: expiresAt.getTime() - now.getTime(),
      message: '連続で断られたため、しばらく合席リクエストを送れません',
    };
  }

  // 3. 특정 상대에 대한 거절 쿨다운 확인
  const { data: rejectionData } = await supabase
    .from('join_cooldowns')
    .select('expires_at')
    .eq('session_id', fromSessionId)
    .eq('target_session_id', toSessionId)
    .eq('cooldown_type', 'rejection_cooldown')
    .gt('expires_at', now.toISOString())
    .limit(1);

  if (rejectionData && rejectionData.length > 0) {
    const expiresAt = new Date(rejectionData[0].expires_at);
    return {
      allowed: false,
      reason: 'rejection_cooldown',
      retryAfterMs: expiresAt.getTime() - now.getTime(),
      message: 'この相手から断られたため、しばらく再リクエストできません',
    };
  }

  // 4. 일반 요청 쿨다운 확인 (5분에 1회)
  const { data: cooldownData } = await supabase
    .from('join_cooldowns')
    .select('expires_at')
    .eq('session_id', fromSessionId)
    .eq('cooldown_type', 'request_cooldown')
    .is('target_session_id', null)
    .gt('expires_at', now.toISOString())
    .limit(1);

  if (cooldownData && cooldownData.length > 0) {
    const expiresAt = new Date(cooldownData[0].expires_at);
    return {
      allowed: false,
      reason: 'request_cooldown',
      retryAfterMs: expiresAt.getTime() - now.getTime(),
      message: '合席リクエストは5分に1回まで送れます',
    };
  }

  // 5. 이미 pending 상태의 요청이 있는지 확인
  const { data: pendingData } = await supabase
    .from('join_requests')
    .select('id')
    .eq('from_session_id', fromSessionId)
    .eq('status', 'pending')
    .limit(1);

  if (pendingData && pendingData.length > 0) {
    return {
      allowed: false,
      reason: 'request_cooldown',
      message: 'すでに保留中の合席リクエストがあります',
    };
  }

  return { allowed: true };
}

/**
 * 요청 쿨다운 기록
 */
export async function recordJoinRequestCooldown(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + JOIN_REQUEST_COOLDOWN_MS);

  await supabase.from('join_cooldowns').insert({
    session_id: sessionId,
    cooldown_type: 'request_cooldown',
    expires_at: expiresAt.toISOString(),
  });
}

/**
 * 거절 쿨다운 기록 및 연속 거절 카운트
 */
export async function recordRejectionCooldown(
  supabase: SupabaseClient,
  rejectedSessionId: string,
  targetSessionId: string
): Promise<void> {
  const now = new Date();
  const rejectionExpiresAt = new Date(now.getTime() + REJECTION_COOLDOWN_MS);

  // 특정 상대에 대한 거절 쿨다운 기록
  await supabase.from('join_cooldowns').insert({
    session_id: rejectedSessionId,
    target_session_id: targetSessionId,
    cooldown_type: 'rejection_cooldown',
    expires_at: rejectionExpiresAt.toISOString(),
  });

  // 최근 1시간 내 거절 횟수 카운트
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const { count } = await supabase
    .from('join_requests')
    .select('id', { count: 'exact', head: true })
    .eq('from_session_id', rejectedSessionId)
    .eq('status', 'rejected')
    .gte('responded_at', oneHourAgo.toISOString());

  // 3회 이상 거절 시 1시간 전체 잠금
  if (count && count >= MAX_REJECTIONS_BEFORE_LOCKOUT) {
    const lockoutExpiresAt = new Date(now.getTime() + MULTIPLE_REJECTION_COOLDOWN_MS);

    await supabase.from('join_cooldowns').insert({
      session_id: rejectedSessionId,
      cooldown_type: 'multiple_rejection',
      expires_at: lockoutExpiresAt.toISOString(),
    });
  }
}

/**
 * 6자리 합석 코드 생성
 */
export function generateJoinCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Rate limit 에러 메시지 (다국어)
 */
export function getJoinRateLimitError(
  reason: string,
  retryAfterMs: number | undefined,
  locale: string = 'ja'
): string {
  const minutes = retryAfterMs ? Math.ceil(retryAfterMs / 60000) : 5;

  const messages: Record<string, Record<string, string>> = {
    ja: {
      request_cooldown: `合席リクエストは5分に1回まで送れます。${minutes}分後に再試行してください。`,
      rejection_cooldown: `この相手から断られたため、30分間は再リクエストできません。`,
      multiple_rejection: `連続で断られたため、1時間は合席リクエストを送れません。`,
      blocked: `この相手には合席リクエストを送れません。`,
    },
    ko: {
      request_cooldown: `합석 요청은 5분에 1회만 가능합니다. ${minutes}분 후에 다시 시도해주세요.`,
      rejection_cooldown: `상대방이 거절했기 때문에 30분간 재요청할 수 없습니다.`,
      multiple_rejection: `연속 거절로 인해 1시간 동안 합석 요청을 보낼 수 없습니다.`,
      blocked: `이 상대에게는 합석 요청을 보낼 수 없습니다.`,
    },
    en: {
      request_cooldown: `You can only send one join request every 5 minutes. Please try again in ${minutes} minutes.`,
      rejection_cooldown: `This person declined your request. You cannot send another request for 30 minutes.`,
      multiple_rejection: `Due to multiple rejections, you cannot send join requests for 1 hour.`,
      blocked: `You cannot send a join request to this person.`,
    },
    'zh-CN': {
      request_cooldown: `合桌请求每5分钟只能发送1次。请在${minutes}分钟后重试。`,
      rejection_cooldown: `对方拒绝了您的请求，30分钟内无法再次发送。`,
      multiple_rejection: `由于连续被拒绝，1小时内无法发送合桌请求。`,
      blocked: `无法向此人发送合桌请求。`,
    },
    'zh-TW': {
      request_cooldown: `合桌請求每5分鐘只能發送1次。請在${minutes}分鐘後重試。`,
      rejection_cooldown: `對方拒絕了您的請求，30分鐘內無法再次發送。`,
      multiple_rejection: `由於連續被拒絕，1小時內無法發送合桌請求。`,
      blocked: `無法向此人發送合桌請求。`,
    },
  };

  const localeMessages = messages[locale] || messages['ja'];
  return localeMessages[reason] || localeMessages['request_cooldown'];
}
