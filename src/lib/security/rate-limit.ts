/**
 * Rate Limiting Utilities
 * 브루트포스 공격 방지를 위한 요청 제한
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Rate limit 설정
const LOGIN_MAX_ATTEMPTS = 5; // 최대 시도 횟수
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15분
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30분 차단

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date | null;
  blocked: boolean;
  blockExpiresAt: Date | null;
}

/**
 * 로그인 시도 기록 및 Rate Limit 체크
 */
export async function checkLoginRateLimit(
  identifier: string, // email 또는 IP
  type: 'email' | 'ip' = 'email'
): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const windowStart = new Date(now.getTime() - LOGIN_WINDOW_MS);

  try {
    // 현재 차단 상태 확인
    const { data: blockData } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('type', type)
      .eq('is_blocked', true)
      .gt('block_expires_at', now.toISOString())
      .single();

    if (blockData) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt: null,
        blocked: true,
        blockExpiresAt: new Date(blockData.block_expires_at),
      };
    }

    // 최근 시도 횟수 조회
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('identifier', identifier)
      .eq('type', type)
      .gte('attempted_at', windowStart.toISOString())
      .order('attempted_at', { ascending: false });

    const attemptCount = attempts?.length || 0;
    const remainingAttempts = Math.max(0, LOGIN_MAX_ATTEMPTS - attemptCount);

    // 시도 횟수 초과 시 차단
    if (attemptCount >= LOGIN_MAX_ATTEMPTS) {
      const blockExpiresAt = new Date(now.getTime() + BLOCK_DURATION_MS);

      // 차단 기록
      await supabase.from('rate_limits').upsert({
        identifier,
        type,
        is_blocked: true,
        block_expires_at: blockExpiresAt.toISOString(),
        updated_at: now.toISOString(),
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt: null,
        blocked: true,
        blockExpiresAt,
      };
    }

    // 첫 시도 시간 기준 리셋 시간 계산
    const firstAttempt = attempts?.[attempts.length - 1];
    const resetAt = firstAttempt
      ? new Date(new Date(firstAttempt.attempted_at).getTime() + LOGIN_WINDOW_MS)
      : null;

    return {
      allowed: true,
      remainingAttempts,
      resetAt,
      blocked: false,
      blockExpiresAt: null,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // 에러 시 허용 (fail-open) - 프로덕션에서는 fail-close 고려
    return {
      allowed: true,
      remainingAttempts: LOGIN_MAX_ATTEMPTS,
      resetAt: null,
      blocked: false,
      blockExpiresAt: null,
    };
  }
}

/**
 * 로그인 시도 기록
 */
export async function recordLoginAttempt(
  identifier: string,
  type: 'email' | 'ip',
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  try {
    await supabase.from('login_attempts').insert({
      identifier,
      type,
      success,
      ip_address: ipAddress,
      user_agent: userAgent,
      attempted_at: new Date().toISOString(),
    });

    // 성공 시 해당 identifier의 실패 기록 초기화 (선택적)
    if (success) {
      await clearLoginAttempts(identifier, type);
    }
  } catch (error) {
    console.error('Record login attempt error:', error);
  }
}

/**
 * 로그인 시도 기록 초기화 (로그인 성공 시)
 */
export async function clearLoginAttempts(
  identifier: string,
  type: 'email' | 'ip'
): Promise<void> {
  const supabase = getSupabaseAdmin();

  try {
    // 실패 기록 삭제
    await supabase
      .from('login_attempts')
      .delete()
      .eq('identifier', identifier)
      .eq('type', type)
      .eq('success', false);

    // 차단 해제
    await supabase
      .from('rate_limits')
      .update({ is_blocked: false, block_expires_at: null })
      .eq('identifier', identifier)
      .eq('type', type);
  } catch (error) {
    console.error('Clear login attempts error:', error);
  }
}

/**
 * 메모리 기반 Rate Limiter (DB 없이 간단히 사용)
 * 서버 재시작 시 초기화됨 - 단일 서버 환경용
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function checkMemoryRateLimit(
  key: string,
  maxAttempts: number = LOGIN_MAX_ATTEMPTS,
  windowMs: number = LOGIN_WINDOW_MS
): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    // 새 윈도우 시작
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }

  record.count++;
  return { allowed: true, remainingAttempts: maxAttempts - record.count };
}

/**
 * 메모리 Rate Limit 초기화
 */
export function clearMemoryRateLimit(key: string): void {
  memoryStore.delete(key);
}
